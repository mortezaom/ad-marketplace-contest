import { desc, eq } from "drizzle-orm"
import type { Context } from "hono"
import type { CreativeModel, UserModel } from "shared"
import { db } from "@/db"
import { channelAdminsTable, dealCreativesTable, dealsTable } from "@/db/schema"
import { parseBody } from "@/utils/helpers"
import { errorResponse, successResponse } from "@/utils/responses"
import { CreateCreativeSchema, UpdateCreativeSchema } from "./validators"

const paramInt = (c: Context, name: string) => Number.parseInt(c.req.param(name), 10)

const getDealOrFail = async (id: number) => {
	const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, id)).limit(1)
	return deal ?? null
}

const getCreativeOrFail = async (id: number) => {
	const [creative] = await db
		.select()
		.from(dealCreativesTable)
		.where(eq(dealCreativesTable.id, id))
		.limit(1)
	return creative ?? null
}

const getUserChannelIds = async (userTid: number): Promise<number[]> => {
	const channels = await db
		.select({ channelId: channelAdminsTable.channelId })
		.from(channelAdminsTable)
		.where(eq(channelAdminsTable.tgUserId, userTid))
	return channels.map((c) => c.channelId)
}

export const handleGetCreativesByDeal = async (c: Context) => {
	const dealId = paramInt(c, "dealId")
	const user = c.get("user") as UserModel

	try {
		const deal = await getDealOrFail(dealId)
		if (!deal) {
			return c.json(errorResponse("Deal not found"), 404)
		}

		// Get user's channel IDs
		const userChannelIds = await getUserChannelIds(user.tid)

		// Check if user has access
		const isAdvertiser = deal.advertiserId === user.tid
		const isChannelOwner = userChannelIds.includes(deal.channelId)

		if (!(isAdvertiser || isChannelOwner)) {
			return c.json(errorResponse("Access denied"), 403)
		}

		// Get all creatives for this deal
		const creatives = await db
			.select({
				id: dealCreativesTable.id,
				dealId: dealCreativesTable.dealId,
				version: dealCreativesTable.version,
				content: dealCreativesTable.content,
				mediaUrls: dealCreativesTable.mediaUrls,
				status: dealCreativesTable.status,
				reviewNote: dealCreativesTable.reviewNote,
				submittedAt: dealCreativesTable.submittedAt,
				reviewedAt: dealCreativesTable.reviewedAt,
				createdAt: dealCreativesTable.createdAt,
			})
			.from(dealCreativesTable)
			.where(eq(dealCreativesTable.dealId, dealId))
			.orderBy(desc(dealCreativesTable.version))

		// Format response
		const formattedCreatives = creatives.map((creative) => ({
			id: creative.id,
			dealId: creative.dealId,
			version: creative.version,
			content: creative.content,
			mediaUrls: creative.mediaUrls ?? [],
			status: creative.status,
			reviewNote: creative.reviewNote,
			submittedAt: creative.submittedAt,
			reviewedAt: creative.reviewedAt,
			createdAt: creative.createdAt,
		}))

		return c.json(successResponse(formattedCreatives))
	} catch (error) {
		console.error("Error fetching creatives:", error)
		return c.json(errorResponse("Failed to fetch creatives", error), 500)
	}
}

export const handleGetCreativeById = async (c: Context) => {
	const id = paramInt(c, "id")
	const user = c.get("user") as UserModel

	try {
		const creative = await getCreativeOrFail(id)
		if (!creative) {
			return c.json(errorResponse("Creative not found"), 404)
		}

		const deal = await getDealOrFail(creative.dealId)
		if (!deal) {
			return c.json(errorResponse("Deal not found"), 404)
		}

		// Get user's channel IDs
		const userChannelIds = await getUserChannelIds(user.tid)

		// Check if user has access
		const isAdvertiser = deal.advertiserId === user.tid
		const isChannelOwner = userChannelIds.includes(deal.channelId)

		if (!(isAdvertiser || isChannelOwner)) {
			return c.json(errorResponse("Access denied"), 403)
		}

		return c.json(
			successResponse({
				id: creative.id,
				dealId: creative.dealId,
				version: creative.version,
				content: creative.content,
				mediaUrls: creative.mediaUrls ?? [],
				status: creative.status,
				reviewNote: creative.reviewNote,
				submittedAt: creative.submittedAt,
				reviewedAt: creative.reviewedAt,
				createdAt: creative.createdAt,
			})
		)
	} catch (error) {
		console.error("Error fetching creative:", error)
		return c.json(errorResponse("Failed to fetch creative", error), 500)
	}
}

export const handleCreateCreative = async (c: Context) => {
	const dealId = paramInt(c, "dealId")
	const body = CreateCreativeSchema.parse(await parseBody(c))
	const user = c.get("user") as UserModel

	try {
		const deal = await getDealOrFail(dealId)
		if (!deal) {
			return c.json(errorResponse("Deal not found"), 404)
		}

		// Get user's channel IDs
		const userChannelIds = await getUserChannelIds(user.tid)

		// Only channel owners can create creatives
		const isChannelOwner = userChannelIds.includes(deal.channelId)
		if (!isChannelOwner) {
			return c.json(errorResponse("Only channel owners can create creatives"), 403)
		}

		// Get the latest version for this deal
		const [latestCreative] = await db
			.select({ version: dealCreativesTable.version })
			.from(dealCreativesTable)
			.where(eq(dealCreativesTable.dealId, dealId))
			.orderBy(desc(dealCreativesTable.version))
			.limit(1)

		const newVersion = latestCreative ? latestCreative.version + 1 : 1

		const [created] = await db
			.insert(dealCreativesTable)
			.values({
				dealId,
				version: newVersion,
				content: body.content,
				mediaUrls: body.mediaUrls ?? [],
				status: "draft",
			})
			.returning()

		// Update deal status
		await db
			.update(dealsTable)
			.set({ status: "awaiting_creative", updatedAt: new Date() })
			.where(eq(dealsTable.id, dealId))

		return c.json(
			successResponse({
				id: created.id,
				dealId: created.dealId,
				version: created.version,
				content: created.content,
				mediaUrls: created.mediaUrls ?? [],
				status: created.status,
				reviewNote: created.reviewNote,
				submittedAt: created.submittedAt,
				reviewedAt: created.reviewedAt,
				createdAt: created.createdAt,
			})
		)
	} catch (error) {
		console.error("Error creating creative:", error)
		return c.json(errorResponse("Failed to create creative", error), 500)
	}
}

export const handleUpdateCreative = async (c: Context) => {
	const id = paramInt(c, "id")
	const body = UpdateCreativeSchema.parse(await parseBody(c))
	const user = c.get("user") as UserModel

	try {
		const creative = await getCreativeOrFail(id)
		if (!creative) {
			return c.json(errorResponse("Creative not found"), 404)
		}

		const deal = await getDealOrFail(creative.dealId)
		if (!deal) {
			return c.json(errorResponse("Deal not found"), 404)
		}

		// Get user's channel IDs
		const userChannelIds = await getUserChannelIds(user.tid)

		// Check access - channel owner can update drafts, advertiser can update review notes
		const isAdvertiser = deal.advertiserId === user.tid
		const isChannelOwner = userChannelIds.includes(deal.channelId)

		// Channel owners can only update drafts
		if (isChannelOwner && creative.status !== "draft") {
			return c.json(errorResponse("Cannot update submitted creative"), 403)
		}

		// Advertisers can approve/reject submitted creatives
		if (isAdvertiser && !body.status) {
			return c.json(errorResponse("Advertisers can only approve or request revisions"), 403)
		}

		if (!(isAdvertiser || isChannelOwner)) {
			return c.json(errorResponse("Access denied"), 403)
		}

		const updateData: Partial<CreativeModel> = {}

		if (body.content !== undefined) {
			updateData.content = body.content
		}
		if (body.mediaUrls !== undefined) {
			updateData.mediaUrls = body.mediaUrls
		}
		if (body.status !== undefined) {
			updateData.status = body.status
			if (body.status === "submitted") {
				updateData.submittedAt = new Date()
				// Update deal status
				await db
					.update(dealsTable)
					.set({ status: "creative_submitted", updatedAt: new Date() })
					.where(eq(dealsTable.id, creative.dealId))
			}
			if (body.status === "approved" || body.status === "revision_requested") {
				updateData.reviewedAt = new Date()
			}
		}
		if (body.reviewNote !== undefined) {
			updateData.reviewNote = body.reviewNote
		}

		const [updated] = await db
			.update(dealCreativesTable)
			.set(updateData)
			.where(eq(dealCreativesTable.id, id))
			.returning()

		// If approved, update deal status to awaiting payment
		if (body.status === "approved") {
			await db
				.update(dealsTable)
				.set({ status: "awaiting_payment", updatedAt: new Date() })
				.where(eq(dealsTable.id, creative.dealId))
		}

		return c.json(
			successResponse({
				id: updated.id,
				dealId: updated.dealId,
				version: updated.version,
				content: updated.content,
				mediaUrls: updated.mediaUrls ?? [],
				status: updated.status,
				reviewNote: updated.reviewNote,
				submittedAt: updated.submittedAt,
				reviewedAt: updated.reviewedAt,
				createdAt: updated.createdAt,
			})
		)
	} catch (error) {
		console.error("Error updating creative:", error)
		return c.json(errorResponse("Failed to update creative", error), 500)
	}
}
