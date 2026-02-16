import { and, eq } from "drizzle-orm"
import type { Context } from "hono"
import type { UserModel } from "shared"
import { db } from "@/db"
import { channelAdminsTable, dealsTable } from "@/db/schema"
import { parseBody } from "@/utils/helpers"
import { errorResponse, successResponse } from "@/utils/responses"
import { setMessageToConversation } from "@/utils/tg-helpers"
import { SendFeedbackSchema } from "./validators"

const paramInt = (c: Context, name: string) => Number.parseInt(c.req.param(name), 10)

export const handleSendFeedback = async (c: Context) => {
	const dealId = paramInt(c, "dealId")
	const body = SendFeedbackSchema.parse(await parseBody(c))
	const user = c.get("user") as UserModel

	try {
		const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, dealId)).limit(1)

		if (!deal) {
			return c.json(errorResponse("Deal not found"), 404)
		}

		const userChannels = await db
			.select({ channelId: channelAdminsTable.channelId })
			.from(channelAdminsTable)
			.where(eq(channelAdminsTable.tgUserId, user.tid))

		const userChannelIds = userChannels.map((c) => c.channelId)
		const isAdvertiser = deal.advertiserId === user.tid
		const isChannelOwner = userChannelIds.includes(deal.channelId)

		let recipientTgId: number

		if (isAdvertiser) {
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
			recipientTgId = deal.advertiserId
		} else {
			return c.json(errorResponse("Access denied"), 403)
		}

		console.log(
			`Feedback for deal ${dealId} from user ${user.tid} to ${recipientTgId}:`,
			body.message
		)

		setMessageToConversation(
			`Message on your deal id: ${dealId} \n\n${body.message}`,
			recipientTgId
		)

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
