import type { Long, TelegramClient } from "@mtcute/bun"
import type { tl } from "@mtcute/tl"
import { eq } from "drizzle-orm"
import type { UserModel } from "shared"
import { db } from "@/db"
import { channelAdminsTable, channelsTable, tgSessions } from "@/db/schema"
import { makeClient, withDelay } from "@/utils/tg-helpers"

interface LanguageStats {
	name: string
	total: number
}

interface GraphData {
	names: Record<string, string>
	columns: (string | number)[][]
}

interface ChannelStatsResult {
	title: string | null
	tgId: bigint
	tgLink: string
	accessHash: string
	subCount: number
	avgPostReach?: number
	languages: LanguageStats[]
}

const getChannelInfo = async (
	tg: TelegramClient,
	channelId: number,
	accessHash: Long
): Promise<{ title: string | null; channelDc: number | null }> => {
	const fullChannel = await withDelay(() =>
		tg.call({
			_: "channels.getFullChannel",
			channel: {
				_: "inputChannel",
				channelId,
				accessHash,
			},
		})
	)

	if (fullChannel.fullChat._ === "channelFull") {
		return {
			title: fullChannel.fullChat.about,
			channelDc: fullChannel.fullChat.statsDc ?? null,
		}
	}

	return {
		title: null,
		channelDc: null,
	}
}

const fetchBroadcastStats = (
	tg: TelegramClient,
	channelId: number,
	accessHash: Long,
	statsDc: number
) => {
	return withDelay(() =>
		tg.call(
			{
				_: "stats.getBroadcastStats",
				channel: {
					_: "inputChannel",
					channelId,
					accessHash,
				},
			},
			{ dcId: statsDc }
		)
	)
}

const extractLanguagesFromStats = async (
	tg: TelegramClient,
	stats: tl.stats.RawBroadcastStats,
	dcId: number
): Promise<LanguageStats[]> => {
	if (stats.languagesGraph._ !== "statsGraphAsync") {
		return []
	}

	const graphData = await tg.call(
		{
			_: "stats.loadAsyncGraph",
			token: stats.languagesGraph.token,
		},
		{ dcId }
	)

	if (graphData._ !== "statsGraph") {
		return []
	}

	const parsed: GraphData = JSON.parse(graphData.json.data)

	const languages: LanguageStats[] = Object.entries(parsed.names).map(([key, name]) => {
		const values = parsed.columns.find((col) => Array.isArray(col) && col[0] === key)

		const total =
			values && Array.isArray(values)
				? values.slice(1).reduce((sum, val) => (sum as number) + (val as number), 0)
				: 0

		return { name, total: total as number }
	})

	languages.sort((a, b) => b.total - a.total)
	return languages
}

export const verifyChannelAdmin = async (
	user: UserModel,
	accountId: string,
	channelInput: string
): Promise<ChannelStatsResult> => {
	const account = await db
		.select()
		.from(tgSessions)
		.where(eq(tgSessions.id, accountId))
		.execute()
		.then((rows) => (rows.length > 0 ? rows[0] : null))

	if (!account) {
		throw new Error("Not a valid account!")
	}

	const tg = makeClient(account.storageKey)
	await tg.connect()

	const username = channelInput.replace("@", "").split("/").pop() ?? ""

	try {
		const chat = await withDelay(() => tg.resolvePeer(username))
		const me = await withDelay(() => tg.resolvePeer("me"))

		if (chat._ !== "inputPeerChannel") {
			throw new Error("This is not a channel")
		}

		const participant = await withDelay(() =>
			tg.call({
				_: "channels.getParticipant",
				channel: {
					_: "inputChannel",
					channelId: chat.channelId,
					accessHash: chat.accessHash,
				},
				participant: me,
			})
		)

		const isAdmin =
			participant.participant._ === "channelParticipantAdmin" ||
			participant.participant._ === "channelParticipantCreator"

		if (!isAdmin) {
			throw new Error("Service account is not an admin in this channel")
		}

		// Get the correct DC for stats
		const { title, channelDc: statsDc } = await getChannelInfo(tg, chat.channelId, chat.accessHash)

		if (!statsDc) {
			throw new Error("Could not get stats DC for this channel")
		}

		const stats = await fetchBroadcastStats(tg, chat.channelId, chat.accessHash, statsDc)

		const languages = await extractLanguagesFromStats(tg, stats, statsDc)

		const result: ChannelStatsResult = {
			tgId: BigInt(chat.channelId),
			accessHash: chat.accessHash.toString(),
			title: title ?? null,
			tgLink: `https://t.me/${username}`,
			subCount: stats.followers.current,
			avgPostReach: stats.viewsPerPost.current,
			languages,
		}

		await db
			.insert(channelsTable)
			.values({
				tgId: result.tgId,
				accessHash: result.accessHash,
				title,
				ownerId: user.tid,
				subCount: result.subCount,
				avgPostReach: result.avgPostReach,
				languages: JSON.stringify(languages),
				tgLink: result.tgLink,
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: channelsTable.tgId,
				set: {
					accessHash: result.accessHash,
					subCount: result.subCount,
					avgPostReach: result.avgPostReach,
					languages: JSON.stringify(languages),
					tgLink: result.tgLink,
					updatedAt: new Date(),
				},
			})

		return result
	} catch (err) {
		console.error(err)
		throw err
	} finally {
		await tg.disconnect()
	}
}

export const syncChannelAdmin = async (
	channelStatsResult: ChannelStatsResult,
	tgUserId: number
): Promise<void> => {
	const channel = await db
		.select({ id: channelsTable.id })
		.from(channelsTable)
		.where(eq(channelsTable.tgId, channelStatsResult.tgId))
		.execute()
		.then((rows) => (rows.length > 0 ? rows[0] : null))

	if (!channel) {
		throw new Error("Channel not found in database")
	}

	await db
		.insert(channelAdminsTable)
		.values({
			channelId: channel.id,
			tgUserId,
			role: "owner",
			source: "telegram",
		})
		.onConflictDoNothing()
}

export const getChannelsByUser = async (tgUserId: number): Promise<ChannelStatsResult[]> => {
	const userAdminChannels = await db
		.select({ channel: channelsTable })
		.from(channelsTable)
		.innerJoin(channelAdminsTable, eq(channelAdminsTable.channelId, channelsTable.id))
		.where(eq(channelAdminsTable.tgUserId, tgUserId))
		.execute()

	if (userAdminChannels.length === 0) {
		throw new Error("User is not an admin or owner of any channel")
	}

	return userAdminChannels.map(({ channel }) => ({
		tgId: channel.tgId,
		accessHash: "",
		title: channel.title ?? "Unknown",
		tgLink: channel.tgLink,
		subCount: channel.subCount ?? 0,
		avgPostReach: channel.avgPostReach ?? 0,
		languages: channel.languages ? JSON.parse(channel.languages) : [],
	}))
}
