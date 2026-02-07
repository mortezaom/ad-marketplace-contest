import { eq } from "drizzle-orm"
import type { Context } from "hono"
import type { UserModel } from "shared"
import { db } from "@/db"
import { tgSessions } from "@/db/schema"
import { errorResponse, successResponse } from "@/utils/responses"
import { getChannelsByUser, syncChannelAdmin, verifyChannelAdmin } from "./helpers"
import { SubmitChannelParam, VerifyChannelParam } from "./validators"

export const handleAssignToChannel = async (c: Context) => {
	const body = SubmitChannelParam.parse(await c.req.json())

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
			sAccountId: {
				id: account.id,
				accountId: account.tgUserId,
				accountName: `${account.tgFirstName} ${account.tgLastName}`,
				username: account.tgUsername,
			},
		})
	)
}

export const handleVerifyChannel = async (c: Context) => {
	const body = VerifyChannelParam.safeParse(await c.req.json())

	if (!body.success) {
		return c.json({ error: true })
	}

	const user = c.get("user") as UserModel

	try {
		const data = await verifyChannelAdmin(user, body.data.accountId, body.data.channelId)

		await syncChannelAdmin(data, user.tid)

		const { accessHash, ...channelData } = data

		return c.json(
			successResponse({
				message: "Channel verified and added successfully",
				channel: channelData,
			})
		)
	} catch (error) {
		console.error(error)
		return c.json({ error: true })
	}
}

export const handleGetChannels = async (c: Context) => {
	try {
		const user = c.get("user") as UserModel

		const channels = (await getChannelsByUser(user.tid)).map(
			({ accessHash, ...channel }) => channel
		)

		return c.json(successResponse(channels))
	} catch (error) {
		console.error(error)
		return c.json(errorResponse("Failed to fetch channels"), 500)
	}
}
