import { and, eq } from "drizzle-orm"
import type { Context } from "hono"
import type { UserModel } from "shared"
import { db } from "@/db"
import { channelAdminsTable, dealsTable } from "@/db/schema"
import { parseBody } from "@/utils/helpers"
import { errorResponse, successResponse } from "@/utils/responses"
import { SendFeedbackSchema } from "./validators"

const paramInt = (c: Context, name: string) => Number.parseInt(c.req.param(name), 10)

export const handleSendFeedback = async (c: Context) => {
	const dealId = paramInt(c, "dealId")
	const body = SendFeedbackSchema.parse(await parseBody(c))
	const user = c.get("user") as UserModel

	try {
		// Get the deal
		const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, dealId)).limit(1)

		if (!deal) {
			return c.json(errorResponse("Deal not found"), 404)
		}

		// Get user's channel IDs
		const userChannels = await db
			.select({ channelId: channelAdminsTable.channelId })
			.from(channelAdminsTable)
			.where(eq(channelAdminsTable.tgUserId, user.tid))

		const userChannelIds = userChannels.map((c) => c.channelId)
		const isAdvertiser = deal.advertiserId === user.tid
		const isChannelOwner = userChannelIds.includes(deal.channelId)

		// Determine who to send feedback to
		let recipientTgId: number

		if (isAdvertiser) {
			// Advertiser sends feedback to channel owner
			const [channelOwner] = await db
				.select({ tgUserId: channelAdminsTable.tgUserId })
				.from(channelAdminsTable)
				.where(
					and(
						eq(channelAdminsTable.channelId, deal.channelId),
						eq(channelAdminsTable.role, "owner")
					)
				)
				.limit(1)

			if (!channelOwner) {
				return c.json(errorResponse("Channel owner not found"), 404)
			}
			recipientTgId = channelOwner.tgUserId
		} else if (isChannelOwner) {
			// Channel owner sends feedback to advertiser
			recipientTgId = deal.advertiserId
		} else {
			return c.json(errorResponse("Access denied"), 403)
		}

		// TODO: In production, integrate with main bot to send Telegram message
		// For now, we'll log the feedback that would be sent
		console.log(
			`Feedback for deal ${dealId} from user ${user.tid} to ${recipientTgId}:`,
			body.message
		)

		// Return success - in production, this would send an actual Telegram message
		return c.json(
			successResponse({
				message: "Feedback sent successfully",
				recipientId: recipientTgId,
			})
		)
	} catch (error) {
		console.error("Error sending feedback:", error)
		return c.json(errorResponse("Failed to send feedback", error), 500)
	}
}
