import { and, desc, eq, inArray, sql } from "drizzle-orm"
import type { Context } from "hono"
import type { DealModel, UserModel } from "shared"
import { db } from "@/db"
import {
	adApplicationsTable,
	adRequestsTable,
	channelAdminsTable,
	channelsTable,
	dealCreativesTable,
	dealsTable,
	usersTable,
} from "@/db/schema"
import { parseBody } from "@/utils/helpers"
import { errorResponse, successResponse } from "@/utils/responses"
import { UpdateDealSchema } from "./validators"

const paramInt = (c: Context, name: string) => Number.parseInt(c.req.param(name), 10)

const getDealOrFail = async (id: number) => {
	const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, id)).limit(1)
	return deal ?? null
}

const getUserChannelIds = async (userTid: number): Promise<number[]> => {
	const channels = await db
		.select({ channelId: channelAdminsTable.channelId })
		.from(channelAdminsTable)
		.where(eq(channelAdminsTable.tgUserId, userTid))
	return channels.map((c) => c.channelId)
}

export const handleGetDeals = async (c: Context) => {
	const user = c.get("user") as UserModel

	try {
		// Get channels where user is an admin (channel owner)
		const userChannelIds = await getUserChannelIds(user.tid)

		// Get deals where user is either the advertiser OR channel owner
		const deals = await db
			.select({
				id: dealsTable.id,
				applicationId: dealsTable.applicationId,
				channelId: dealsTable.channelId,
				advertiserId: dealsTable.advertiserId,
				adFormat: dealsTable.adFormat,
				agreedPrice: dealsTable.agreedPrice,
				status: dealsTable.status,
				scheduledPostAt: dealsTable.scheduledPostAt,
				minPostDurationHours: dealsTable.minPostDurationHours,
				completedAt: dealsTable.completedAt,
				cancelledAt: dealsTable.cancelledAt,
				createdAt: dealsTable.createdAt,
				updatedAt: dealsTable.updatedAt,
				// Channel info
				channelTitle: channelsTable.title,
				channelTgLink: channelsTable.tgLink,
				channelSubCount: channelsTable.subCount,
				// Ad request info
				adRequestTitle: adRequestsTable.title,
				adRequestId: adRequestsTable.id,
			})
			.from(dealsTable)
			.innerJoin(adApplicationsTable, eq(dealsTable.applicationId, adApplicationsTable.id))
			.innerJoin(adRequestsTable, eq(adApplicationsTable.adRequestId, adRequestsTable.id))
			.innerJoin(channelsTable, eq(dealsTable.channelId, channelsTable.id))
			.where(
				and(
					// User is either advertiser or channel owner
					userChannelIds.length > 0 ? inArray(dealsTable.channelId, userChannelIds) : sql`1=0`,
					eq(dealsTable.advertiserId, user.tid)
				)
					? sql`(${inArray(dealsTable.channelId, userChannelIds)} OR ${eq(dealsTable.advertiserId, user.tid)})`
					: eq(dealsTable.advertiserId, user.tid)
			)
			.orderBy(desc(dealsTable.createdAt))

		// Format response
		const formattedDeals = deals.map((d) => ({
			id: d.id,
			applicationId: d.applicationId,
			channelId: d.channelId,
			advertiserId: d.advertiserId,
			adFormat: d.adFormat,
			agreedPrice: Number(d.agreedPrice),
			status: d.status,
			scheduledPostAt: d.scheduledPostAt,
			minPostDurationHours: d.minPostDurationHours,
			completedAt: d.completedAt,
			cancelledAt: d.cancelledAt,
			createdAt: d.createdAt,
			updatedAt: d.updatedAt,
			channel: {
				title: d.channelTitle,
				tgLink: d.channelTgLink,
				subCount: d.channelSubCount ?? 0,
			},
			adRequest: {
				id: d.adRequestId,
				title: d.adRequestTitle,
			},
			// Determine user role for this deal
			userRole: d.advertiserId === user.tid ? "advertiser" : "channel_owner",
		}))

		return c.json(successResponse(formattedDeals))
	} catch (error) {
		console.error("Error fetching deals:", error)
		return c.json(errorResponse("Failed to fetch deals", error), 500)
	}
}

export const handleGetDealById = async (c: Context) => {
	const id = paramInt(c, "id")
	const user = c.get("user") as UserModel

	try {
		const deal = await getDealOrFail(id)
		if (!deal) {
			return c.json(errorResponse("Deal not found"), 404)
		}

		// Get user's channel IDs
		const userChannelIds = await getUserChannelIds(user.tid)

		// Check if user has access to this deal
		const isAdvertiser = deal.advertiserId === user.tid
		const isChannelOwner = userChannelIds.includes(deal.channelId)

		if (!(isAdvertiser || isChannelOwner)) {
			return c.json(errorResponse("Access denied"), 403)
		}

		// Get full deal details
		const [fullDeal] = await db
			.select({
				id: dealsTable.id,
				applicationId: dealsTable.applicationId,
				channelId: dealsTable.channelId,
				advertiserId: dealsTable.advertiserId,
				adFormat: dealsTable.adFormat,
				agreedPrice: dealsTable.agreedPrice,
				status: dealsTable.status,
				scheduledPostAt: dealsTable.scheduledPostAt,
				minPostDurationHours: dealsTable.minPostDurationHours,
				completedAt: dealsTable.completedAt,
				cancelledAt: dealsTable.cancelledAt,
				createdAt: dealsTable.createdAt,
				updatedAt: dealsTable.updatedAt,
				// Channel info
				channelTitle: channelsTable.title,
				channelTgLink: channelsTable.tgLink,
				channelTgId: channelsTable.tgId,
				channelSubCount: channelsTable.subCount,
				channelAvgPostReach: channelsTable.avgPostReach,
				// Ad request info
				adRequestTitle: adRequestsTable.title,
				adRequestDescription: adRequestsTable.description,
				adRequestId: adRequestsTable.id,
				adRequestBudget: adRequestsTable.budget,
				adRequestContentGuidelines: adRequestsTable.contentGuidelines,
				// Application info
				applicationStatus: adApplicationsTable.status,
				// Advertiser info
				advertiserFirstName: usersTable.first_name,
				advertiserLastName: usersTable.last_name,
				advertiserUsername: usersTable.username,
			})
			.from(dealsTable)
			.innerJoin(adApplicationsTable, eq(dealsTable.applicationId, adApplicationsTable.id))
			.innerJoin(adRequestsTable, eq(adApplicationsTable.adRequestId, adRequestsTable.id))
			.innerJoin(channelsTable, eq(dealsTable.channelId, channelsTable.id))
			.innerJoin(usersTable, eq(dealsTable.advertiserId, usersTable.tid))
			.where(eq(dealsTable.id, id))
			.limit(1)

		if (!fullDeal) {
			return c.json(errorResponse("Deal not found"), 404)
		}

		// Get the latest creative for this deal
		const [latestCreative] = await db
			.select({
				id: dealCreativesTable.id,
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
			.where(eq(dealCreativesTable.dealId, id))
			.orderBy(desc(dealCreativesTable.version))
			.limit(1)

		const response = {
			id: fullDeal.id,
			applicationId: fullDeal.applicationId,
			channelId: fullDeal.channelId,
			advertiserId: fullDeal.advertiserId,
			adFormat: fullDeal.adFormat,
			agreedPrice: Number(fullDeal.agreedPrice),
			status: fullDeal.status,
			scheduledPostAt: fullDeal.scheduledPostAt,
			minPostDurationHours: fullDeal.minPostDurationHours,
			completedAt: fullDeal.completedAt,
			cancelledAt: fullDeal.cancelledAt,
			createdAt: fullDeal.createdAt,
			updatedAt: fullDeal.updatedAt,
			channel: {
				id: fullDeal.channelId,
				title: fullDeal.channelTitle,
				tgId: fullDeal.channelTgId?.toString() ?? "",
				tgLink: fullDeal.channelTgLink ?? "",
				subCount: fullDeal.channelSubCount ?? 0,
				avgPostReach: fullDeal.channelAvgPostReach ?? 0,
			},
			adRequest: {
				id: fullDeal.adRequestId,
				title: fullDeal.adRequestTitle,
				description: fullDeal.adRequestDescription,
				budget: Number(fullDeal.adRequestBudget),
				contentGuidelines: fullDeal.adRequestContentGuidelines,
			},
			application: {
				id: fullDeal.applicationId,
				status: fullDeal.applicationStatus,
			},
			advertiser: {
				id: fullDeal.advertiserId,
				firstName: fullDeal.advertiserFirstName,
				lastName: fullDeal.advertiserLastName,
				username: fullDeal.advertiserUsername,
			},
			creative: latestCreative
				? {
						...latestCreative,
						mediaUrls: latestCreative.mediaUrls ?? [],
					}
				: null,
			userRole: isAdvertiser ? "advertiser" : "channel_owner",
		}

		return c.json(successResponse(response))
	} catch (error) {
		console.error("Error fetching deal:", error)
		return c.json(errorResponse("Failed to fetch deal", error), 500)
	}
}

export const handleUpdateDeal = async (c: Context) => {
	const id = paramInt(c, "id")
	const body = UpdateDealSchema.parse(await parseBody(c))
	const user = c.get("user") as UserModel

	try {
		const deal = await getDealOrFail(id)
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

		const updateData: Partial<DealModel> = {
			...body,
			scheduledPostAt: body.scheduledPostAt ? new Date(body.scheduledPostAt) : null,
			updatedAt: new Date(),
		}

		if (body.scheduledPostAt) {
			updateData.scheduledPostAt = new Date(body.scheduledPostAt)
		}

		const [updated] = await db
			.update(dealsTable)
			.set(updateData)
			.where(eq(dealsTable.id, id))
			.returning()

		return c.json(successResponse(updated))
	} catch (error) {
		console.error("Error updating deal:", error)
		return c.json(errorResponse("Failed to update deal", error), 500)
	}
}

export const handleGetChannelOwnerForDeal = async (c: Context) => {
	const id = paramInt(c, "id")

	try {
		const deal = await getDealOrFail(id)
		if (!deal) {
			return c.json(errorResponse("Deal not found"), 404)
		}

		// Get channel owner info
		const [channelAdmin] = await db
			.select({
				tgUserId: channelAdminsTable.tgUserId,
				role: channelAdminsTable.role,
			})
			.from(channelAdminsTable)
			.where(
				and(eq(channelAdminsTable.channelId, deal.channelId), eq(channelAdminsTable.role, "owner"))
			)
			.limit(1)

		if (!channelAdmin) {
			return c.json(errorResponse("Channel owner not found"), 404)
		}

		// Get owner user details
		const [ownerUser] = await db
			.select({
				tid: usersTable.tid,
				firstName: usersTable.first_name,
				lastName: usersTable.last_name,
				username: usersTable.username,
			})
			.from(usersTable)
			.where(eq(usersTable.tid, channelAdmin.tgUserId))
			.limit(1)

		return c.json(
			successResponse({
				tgUserId: channelAdmin.tgUserId,
				firstName: ownerUser?.firstName ?? "Unknown",
				lastName: ownerUser?.lastName ?? "",
				username: ownerUser?.username ?? null,
			})
		)
	} catch (error) {
		console.error("Error getting channel owner:", error)
		return c.json(errorResponse("Failed to get channel owner", error), 500)
	}
}
