import { and, desc, eq } from "drizzle-orm"
import type { Context } from "hono"
import type { AdminWithUser, ChannelDetailResponse, UserModel } from "shared"
import { mainBot } from "@/bot"
import { db } from "@/db"
import { channelAdminsTable, channelsTable, tgSessions, usersTable } from "@/db/schema"
import { decodePhotoToken, parseBody } from "@/utils/helpers"
import { errorResponse, successResponse } from "@/utils/responses"
import {
	getChannelsByUser,
	getWeeklyPostStats,
	syncChannelAdmin,
	syncNewAdminByOwner,
	verifyChannelAdmin,
} from "./helpers"
import {
	AddAdminToChannelParam,
	SetListingInfoParam,
	SubmitChannelParam,
	VerifyChannelParam,
} from "./validators"

export const hangleAgentForChannel = async (c: Context) => {
	const body = SubmitChannelParam.parse(await parseBody(c))

	const account = await db
		.select()
		.from(tgSessions)
		.where(eq(tgSessions.status, "active"))
		.limit(1)
		.execute()
		.then((rows) => (rows.length > 0 ? rows[0] : null))

	if (!account) {
		return c.json(errorResponse("Add channel not possible, try again later!"), 500)
	}

	return c.json(
		successResponse({
			channelId: body.channelId,
			agent: {
				id: account.id,
				accountId: account.tgUserId,
				accountName: `${account.tgFirstName} ${account.tgLastName}`,
				username: account.tgUsername,
			},
		})
	)
}

export const handleVerifyChannel = async (c: Context) => {
	const body = VerifyChannelParam.safeParse(await parseBody(c))

	if (!body.success) {
		return c.json(errorResponse("Fields are incomplete!"))
	}

	const user = c.get("user") as UserModel

	try {
		const data = await verifyChannelAdmin(user, body.data.accountId, body.data.channelId)

		await syncChannelAdmin(data, user.tid)

		const { accessHash, ...channelData } = data

		return c.json(
			successResponse({
				message: "Channel verified and added successfully",
				channel: {
					...channelData,
					tgId: data.tgId.toString(),
				},
			})
		)
	} catch (error) {
		return c.json(
			errorResponse(
				"Failed to verify channel, make sure the account is admin of the channel!",
				error
			),
			500
		)
	}
}

export const handleGetChannels = async (c: Context) => {
	try {
		const user = c.get("user") as UserModel

		const channels = (await getChannelsByUser(user.tid)).map(({ accessHash, ...channel }) => ({
			...channel,
		}))

		return c.json(successResponse(channels))
	} catch {
		return c.json(successResponse([]))
	}
}

export const handleGetChannelsForRequest = async (c: Context) => {
	try {
		const user = c.get("user") as UserModel
		const request = c.req.query("request")

		if (!request) {
			return c.json(errorResponse("request id is mandatory!"))
		}

		const channels = (await getChannelsByUser(user.tid, request)).map(
			({ accessHash, ...channel }) => ({
				...channel,
				tgId: channel.tgId.toString(),
			})
		)

		return c.json(successResponse(channels))
	} catch (error) {
		return c.json(errorResponse(`${error}`), 500)
	}
}

export const handleGetChannelPhoto = async (c: Context) => {
	const token = c.req.param("token")
	if (!token) {
		return c.json({ error: "Missing token" }, 400)
	}

	const fileId = decodePhotoToken(token)

	try {
		const buffer = await mainBot.downloadAsBuffer(fileId)

		if (!buffer) {
			return c.json({ error: "Download failed" }, 404)
		}

		c.header("Content-Type", "image/jpeg")
		c.header("Cache-Control", "public, max-age=3600")

		return c.body(buffer.buffer as ArrayBuffer)
	} catch (err) {
		console.error("Bot download error:", err)
		return c.json({ error: "Failed to download" }, 500)
	}
}

export const handleChannelPhotoByUsername = async (c: Context) => {
	const username = c.req.param("username")

	try {
		const chat = await mainBot.getChat(username)

		if (!chat.photo) {
			return c.json({ error: "No photo" }, 404)
		}

		const buffer = await mainBot.downloadAsBuffer(chat.photo.big.fileId)

		c.header("Content-Type", "image/jpeg")
		return c.body(buffer.buffer as ArrayBuffer)
	} catch (err) {
		console.error("Error fetching channel photo:", err)
		return c.json({ error: "Failed" }, 500)
	}
}

export const handleGetChannelById = async (c: Context) => {
	const tgId = c.req.param("id")
	const user = c.get("user") as UserModel

	try {
		const channel = await db
			.select()
			.from(channelsTable)
			.where(eq(channelsTable.tgId, BigInt(tgId)))
			.limit(1)
			.then((rows) => (rows.length > 0 ? rows[0] : null))

		if (!channel) {
			return c.json(errorResponse("Channel not found"), 404)
		}

		const isAdmin = await db
			.select()
			.from(channelAdminsTable)
			.where(
				and(eq(channelAdminsTable.channelId, channel.id), eq(channelAdminsTable.tgUserId, user.tid))
			)
			.limit(1)
			.then((rows) => rows.length > 0)

		if (!isAdmin) {
			return c.json(errorResponse("Access denied"), 403)
		}

		const weeklyStats = await getWeeklyPostStats(channel.id)

		const response: ChannelDetailResponse = {
			channel: {
				id: channel.id,
				title: channel.title,
				tgId: channel.tgId.toString(),
				tgLink: channel.tgLink,
				subCount: channel.subCount ?? 0,
				avgPostReach: channel.avgPostReach ?? 0,
				languages: channel.languages ? JSON.parse(channel.languages) : [],
				offersCount: 0,
				adsPublished: 0,
				listingInfo: channel.listingInfo
					? JSON.parse(channel.listingInfo)
					: {
							postPrice: 0,
							storyPrice: 0,
							forwardPrice: 0,
						},
				isPublic: channel.isPublic ?? false,
			},
			weeklyStats,
		}

		return c.json(successResponse(response))
	} catch (error) {
		console.error("Error fetching channel:", error)
		return c.json(errorResponse("Failed to fetch channel details"), 500)
	}
}

export const handleGetChannelAdmins = async (c: Context) => {
	const tgId = c.req.param("id")
	const user = c.get("user") as UserModel

	try {
		const channel = await db
			.select({ id: channelsTable.id })
			.from(channelsTable)
			.where(eq(channelsTable.tgId, BigInt(tgId)))
			.limit(1)
			.then((rows) => (rows.length > 0 ? rows[0] : null))

		if (!channel) {
			return c.json(errorResponse("Channel not found"), 404)
		}

		const requesterAdmin = await db
			.select()
			.from(channelAdminsTable)
			.where(
				and(eq(channelAdminsTable.channelId, channel.id), eq(channelAdminsTable.tgUserId, user.tid))
			)
			.limit(1)
			.then((rows) => (rows.length > 0 ? rows[0] : null))

		if (!requesterAdmin) {
			return c.json(errorResponse("Access denied"), 403)
		}

		const admins = await db
			.select({
				id: channelAdminsTable.id,
				tgUserId: channelAdminsTable.tgUserId,
				role: channelAdminsTable.role,
				addedAt: channelAdminsTable.addedAt,
				source: channelAdminsTable.source,
				user: {
					tid: usersTable.tid,
					first_name: usersTable.first_name,
					last_name: usersTable.last_name,
					photo_url: usersTable.photo_url,
					username: usersTable.username,
				},
			})
			.from(channelAdminsTable)
			.innerJoin(usersTable, eq(channelAdminsTable.tgUserId, usersTable.tid))
			.where(eq(channelAdminsTable.channelId, channel.id))
			.orderBy(desc(channelAdminsTable.role))

		return c.json(successResponse({ admins: admins as AdminWithUser[] }))
	} catch (error) {
		console.error("Error fetching admins:", error)
		return c.json(errorResponse("Failed to fetch channel admins"), 500)
	}
}

export const handleAddAdmin = async (c: Context) => {
	const tgId = c.req.param("id")
	const user = c.get("user") as UserModel
	const body = AddAdminToChannelParam.safeParse(await parseBody(c))

	if (body.error) {
		return c.json(errorResponse(body.error.message), 422)
	}

	try {
		const channel = await db
			.select({ id: channelsTable.id, tgLink: channelsTable.tgLink })
			.from(channelsTable)
			.where(eq(channelsTable.tgId, BigInt(tgId)))
			.limit(1)
			.then((rows) => (rows.length > 0 ? rows[0] : null))

		if (!channel) {
			return c.json(errorResponse("Channel not found"), 404)
		}

		const requesterAdmin = await db
			.select()
			.from(channelAdminsTable)
			.where(
				and(eq(channelAdminsTable.channelId, channel.id), eq(channelAdminsTable.tgUserId, user.tid))
			)
			.limit(1)
			.then((rows) => (rows.length > 0 ? rows[0] : null))

		if (!requesterAdmin) {
			return c.json(errorResponse("Access denied"), 403)
		}

		const data = await syncNewAdminByOwner(body.data.newAdminUsername, channel.tgLink, channel.id)

		if (!data) {
			return c.json(errorResponse("Admin already exists"), 403)
		}

		return c.json(successResponse(data))
	} catch (error) {
		console.error(error)
		return c.json(errorResponse(`${error}`, error), 500)
	}
}

export const handleDemoteAdmin = async (c: Context) => {
	const tgId = c.req.param("id")
	const adminId = c.req.param("adminId")
	const user = c.get("user") as UserModel

	try {
		const channel = await db
			.select({ id: channelsTable.id })
			.from(channelsTable)
			.where(eq(channelsTable.tgId, BigInt(tgId)))
			.limit(1)
			.then((rows) => (rows.length > 0 ? rows[0] : null))

		if (!channel) {
			return c.json(errorResponse("Channel not found"), 404)
		}

		const requesterAdmin = await db
			.select()
			.from(channelAdminsTable)
			.where(
				and(
					eq(channelAdminsTable.channelId, channel.id),
					eq(channelAdminsTable.tgUserId, user.tid),
					eq(channelAdminsTable.role, "owner")
				)
			)
			.limit(1)
			.then((rows) => (rows.length > 0 ? rows[0] : null))

		if (!requesterAdmin) {
			return c.json(errorResponse("Only owners can demote admins"), 403)
		}

		const adminToDemote = await db
			.select()
			.from(channelAdminsTable)
			.where(
				and(
					eq(channelAdminsTable.id, Number.parseInt(adminId, 10)),
					eq(channelAdminsTable.channelId, channel.id)
				)
			)
			.limit(1)
			.then((rows) => (rows.length > 0 ? rows[0] : null))

		if (!adminToDemote) {
			return c.json(errorResponse("Admin not found"), 404)
		}

		if (adminToDemote.role === "owner") {
			return c.json(errorResponse("Cannot demote channel owner"), 400)
		}

		if (adminToDemote.tgUserId === user.tid) {
			return c.json(errorResponse("Cannot demote yourself"), 400)
		}

		await db
			.delete(channelAdminsTable)
			.where(eq(channelAdminsTable.id, Number.parseInt(adminId, 10)))

		return c.json(successResponse({ message: "Admin demoted successfully" }))
	} catch (error) {
		console.error("Error demoting admin:", error)
		return c.json(errorResponse("Failed to demote admin"), 500)
	}
}

export const handleListingSetting = async (c: Context) => {
	const tgId = c.req.param("id")
	const user = c.get("user") as UserModel
	const body = SetListingInfoParam.safeParse(await parseBody(c))
	if (body.error) {
		return c.json(errorResponse(body.error.message), 422)
	}
	try {
		const channel = await db
			.select({ id: channelsTable.id })
			.from(channelsTable)
			.where(eq(channelsTable.tgId, BigInt(tgId)))
			.limit(1)
			.then((rows) => (rows.length > 0 ? rows[0] : null))

		if (!channel) {
			return c.json(errorResponse("Channel not found"), 404)
		}

		const requesterAdmin = await db
			.select()
			.from(channelAdminsTable)
			.where(
				and(eq(channelAdminsTable.channelId, channel.id), eq(channelAdminsTable.tgUserId, user.tid))
			)
			.limit(1)
			.then((rows) => (rows.length > 0 ? rows[0] : null))

		if (!requesterAdmin) {
			return c.json(errorResponse("No access to this channel!"), 403)
		}

		const { isPublic, ...restBody } = body.data

		await db
			.update(channelsTable)
			.set({ listingInfo: JSON.stringify(restBody), isPublic, updatedAt: new Date() })
			.where(eq(channelsTable.id, channel.id))

		return c.json(successResponse({ message: "Updated Successfully!" }))
	} catch (error) {
		console.error(error)
		return c.json(errorResponse("Failed to update listing info", error), 500)
	}
}

export const handleGetPublicChannels = async (c: Context) => {
	try {
		const channels = await db
			.select()
			.from(channelsTable)
			.where(eq(channelsTable.isPublic, true))
			.execute()

		return c.json(
			successResponse(
				channels.map((c) => {
					return {
						title: c.title,
						tgId: c.tgId.toString(),
						tgLink: c.tgLink,
						subCount: c.subCount ?? 0,
						avgPostReach: c.avgPostReach ?? 0,
						languages: c.languages ? JSON.parse(c.languages) : [],
						offersCount: 0,
						adsPublished: 0,
						listingInfo: c.listingInfo
							? JSON.parse(c.listingInfo)
							: {
									postPrice: 0,
									storyPrice: 0,
									forwardPrice: 0,
								},
						isPublic: c.isPublic ?? false,
					}
				})
			)
		)
	} catch (error) {
		return c.json(errorResponse("Failed to get channel list", error), 500)
	}
}
