import type { Long, TelegramClient } from "@mtcute/bun"
import type { tl } from "@mtcute/tl"
import { and, eq, gte, type SQL } from "drizzle-orm"
import type { UserModel } from "shared"
import { mainBot } from "@/bot"
import { db } from "@/db"
import { adRequestsTable, channelAdminsTable, channelsTable, tgSessions } from "@/db/schema"
import { decodePhotoToken, encodePhotoToken } from "@/utils/helpers"
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
	id: number
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
): Promise<{ title: string | null; photo: string | null; channelDc: number | null }> => {
	// 1. Get Full Channel (for stats DC)
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

	// 2. Get Chat Info (High-level object)
	const chat = await withDelay(() => tg.getChat(channelId))

	let photoToken: string | null = null

	// Check if photo exists
	if (chat.photo) {
		const fileId = chat.photo.big.fileId

		if (fileId) {
			photoToken = encodePhotoToken(fileId)
		}
	}

	if (fullChannel.fullChat._ === "channelFull") {
		return {
			title: chat.title,
			photo: photoToken,
			channelDc: fullChannel.fullChat.statsDc ?? null,
		}
	}

	return { title: null, photo: null, channelDc: null }
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

		const result = {
			tgId: BigInt(chat.channelId),
			accessHash: chat.accessHash.toString(),
			title: title ?? null,
			tgLink: `https://t.me/${username}`,
			subCount: stats.followers.current,
			avgPostReach: stats.viewsPerPost.current,
			languages,
		}

		const insertedChannel = await db
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
			.returning({ id: channelsTable.id })

		return { ...result, id: insertedChannel[0].id }
	} catch (err) {
		console.error(err)
		throw err
	} finally {
		await tg.disconnect()
	}
}

export const syncNewAdminByOwner = async (
	adminId: string,
	channelInput: string,
	channelId: number
) => {
	const account = await db
		.select()
		.from(tgSessions)
		.where(eq(tgSessions.status, "active"))
		.limit(1)
		.execute()
		.then((rows) => (rows.length > 0 ? rows[0] : null))

	if (!account) {
		throw new Error("Not a valid account!")
	}

	const tg = makeClient(account.storageKey)
	await tg.connect()

	const username = channelInput.replace("@", "").split("/").pop() ?? ""

	try {
		const chat = await withDelay(() => tg.resolvePeer(`@${username}`))
		const currentUser = await withDelay(() => tg.resolvePeer(`@${adminId}`))

		const getUserData = await mainBot.getUser(currentUser)

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
				participant: currentUser,
			})
		)

		const isAdmin =
			participant.participant._ === "channelParticipantAdmin" ||
			participant.participant._ === "channelParticipantCreator"

		if (!isAdmin) {
			throw new Error("This account is not an admin in this channel!")
		}

		const data = await db
			.insert(channelAdminsTable)
			.values({
				channelId,
				tgUserId: getUserData.id,
				role: "admin",
				source: "invite",
			})
			.onConflictDoNothing()
			.returning()

		return data.length ? data[0] : null
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

	const existingAdmin = await db
		.select({ id: channelAdminsTable.id })
		.from(channelAdminsTable)
		.where(
			and(eq(channelAdminsTable.channelId, channel.id), eq(channelAdminsTable.tgUserId, tgUserId))
		)
		.execute()
		.then((rows) => (rows.length > 0 ? rows[0] : null))

	if (existingAdmin) {
		return
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

export const getChannelsByUser = async (
	tgUserId: number,
	request?: string
): Promise<ChannelStatsResult[]> => {
	let requestData: typeof adRequestsTable.$inferSelect | null = null

	if (request) {
		requestData = await db
			.select()
			.from(adRequestsTable)
			.where(eq(adRequestsTable.id, Number(request)))
			.execute()
			.then((req) => (req.length ? req[0] : null))

		if (!requestData) {
			return []
		}
	}

	const conditions: SQL[] = [eq(channelAdminsTable.tgUserId, tgUserId)]

	if (requestData?.minSubscribers != null) {
		conditions.push(gte(channelsTable.subCount, requestData.minSubscribers))
	}

	const userAdminChannels = await db
		.select({ channel: channelsTable })
		.from(channelsTable)
		.innerJoin(channelAdminsTable, eq(channelAdminsTable.channelId, channelsTable.id))
		.where(and(...conditions))
		.execute()

	if (userAdminChannels.length === 0) {
		const defaultMessage = "User is not an admin or owner of any channel"
		throw new Error(request ? "No applicable channel for this reqeust!" : defaultMessage)
	}

	let filtered = userAdminChannels

	if (requestData?.language && requestData?.language !== null) {
		filtered = filtered.filter(({ channel }) => {
			const langs: string[] = channel.languages
				? JSON.parse(channel.languages).map((l: LanguageStats) => l.name)
				: []
			return langs.includes(requestData.language ?? "")
		})
	}
	if (requestData?.budget != null) {
		filtered = filtered.filter(({ channel }) => {
			if (!channel.listingInfo) {
				return false
			}
			const listing = JSON.parse(channel.listingInfo)
			console.log(listing)
			console.log(listing.postPrice, requestData.budget)
			return listing.postPrice > 0 && listing.postPrice <= requestData.budget
		})
	}

	return filtered.map(({ channel }) => ({
		id: channel.id,
		tgId: channel.tgId,
		accessHash: "",
		title: channel.title ?? "Unknown",
		tgLink: channel.tgLink,
		subCount: channel.subCount ?? 0,
		avgPostReach: channel.avgPostReach ?? 0,
		languages: channel.languages ? JSON.parse(channel.languages) : [],
	}))
}

export const getChannelPhotoByToken = async (
	tg: TelegramClient,
	token: string
): Promise<Uint8Array> => {
	const fileId = decodePhotoToken(token)

	const buffer = await tg.downloadAsBuffer(fileId)

	if (!buffer) {
		throw new Error("Failed to download photo")
	}

	return buffer
}

export const getWeeklyPostStats = (_: number): { day: string; posts: number }[] => {
	// Placeholder implementation - returns mock data
	const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
	const today = new Date().getDay()

	const orderedDays = [
		...days.slice(today === 0 ? 6 : today - 1),
		...days.slice(0, today === 0 ? 6 : today - 1),
	]

	return orderedDays.map((day, index) => ({
		day,
		posts: Math.floor(Math.random() * 10) + (6 - index),
	}))
}
