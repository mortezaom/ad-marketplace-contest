import { and, desc, eq, exists } from "drizzle-orm"
import type { Context } from "hono"
import type { UserModel } from "shared"
import { db } from "@/db"
import {
	adApplicationsTable,
	adRequestsTable,
	channelAdminsTable,
	channelsTable,
	usersTable,
} from "@/db/schema"
import { parseBody } from "@/utils/helpers"
import { errorResponse, successResponse } from "@/utils/responses"
import { ApplyToAdRequestSchema, CreateAdRequestSchema, UpdateAdRequestSchema } from "./validators"

// Create a new ad request
export const handleCreateAdRequest = async (c: Context) => {
	const body = CreateAdRequestSchema.parse(await parseBody(c))
	const user = c.get("user") as UserModel

	try {
		const [adRequest] = await db
			.insert(adRequestsTable)
			.values({
				title: body.title,
				description: body.description,
				budget: body.budget,
				minSubscribers: body.minSubscribers,
				language: body.language,
				deadline: body.deadline ? new Date(body.deadline) : null,
				adFormat: body.adFormat,
				contentGuidelines: body.contentGuidelines,
				advertiserId: user.tid,
			})
			.returning()

		return c.json(successResponse(adRequest))
	} catch (error) {
		console.error("Error creating ad request:", error)
		return c.json(errorResponse("Failed to create ad request", error), 500)
	}
}

// Get all open ad requests (for channel owners to browse)
export const handleGetAdRequests = async (c: Context) => {
	try {
		const user = c.get("user") as UserModel

		// Get user's channel IDs (channels where user is admin)
		const userChannels = await db
			.select({ channelId: channelAdminsTable.channelId })
			.from(channelAdminsTable)
			.where(eq(channelAdminsTable.tgUserId, user.tid))

		const userChannelIds = userChannels.map((ch) => ch.channelId)
		const hasChannels = userChannelIds.length > 0

		// Get query params for filters
		const url = new URL(c.req.url)
		const status = url.searchParams.get("status") as
			| "open"
			| "in_progress"
			| "completed"
			| "cancelled"
			| null
		const minBudget = url.searchParams.get("minBudget")
		const maxBudget = url.searchParams.get("maxBudget")
		const language = url.searchParams.get("language")
		const adFormat = url.searchParams.get("adFormat") as "post" | "story" | "forward" | null

		// If user has no channels, show only their own ads
		let requests
		if (!hasChannels) {
			// User has no channels - show only their own ads
			requests = await db
				.select()
				.from(adRequestsTable)
				.where(eq(adRequestsTable.advertiserId, user.tid))
				.orderBy(desc(adRequestsTable.createdAt))
		} else {
			// User has channels - show all open ads
			requests = await db
				.select()
				.from(adRequestsTable)
				.where(eq(adRequestsTable.status, "open"))
				.orderBy(desc(adRequestsTable.createdAt))
		}

		// Apply filters in memory
		let filteredRequests = requests
		if (minBudget) {
			filteredRequests = filteredRequests.filter((r) => r.budget >= Number.parseInt(minBudget, 10))
		}
		if (maxBudget) {
			filteredRequests = filteredRequests.filter((r) => r.budget <= Number.parseInt(maxBudget, 10))
		}
		if (language) {
			filteredRequests = filteredRequests.filter((r) => r.language === language)
		}
		if (adFormat) {
			filteredRequests = filteredRequests.filter((r) => r.adFormat === adFormat)
		}
		if (status) {
			filteredRequests = filteredRequests.filter((r) => r.status === status)
		}

		// If user has channels, add isOwn and hasApplied flags
		const processedRequests = hasChannels
			? await Promise.all(
					filteredRequests.map(async (request) => {
						const existingApplication = await db
							.select()
							.from(adApplicationsTable)
							.where(
								and(
									eq(adApplicationsTable.adRequestId, request.id),
									exists(
										db
											.select()
											.from(channelAdminsTable)
											.where(
												and(
													eq(channelAdminsTable.channelId, adApplicationsTable.channelId),
													eq(channelAdminsTable.tgUserId, user.tid)
												)
											)
									)
								)
							)
							.limit(1)

						return {
							...request,
							isOwn: request.advertiserId === user.tid,
							hasApplied: existingApplication.length > 0,
						}
					})
				)
			: filteredRequests.map((request) => ({
					...request,
					isOwn: true,
					hasApplied: false,
				}))

		// Return with filter metadata
		return c.json(
			successResponse({
				requests: processedRequests,
				filters: {
					hasChannels,
					total: processedRequests.length,
				},
			})
		)
	} catch (error) {
		console.error("Error fetching ad requests:", error)
		return c.json(errorResponse("Failed to fetch ad requests", error), 500)
	}
}

// Get advertiser's own ad requests
export const handleGetMyAdRequests = async (c: Context) => {
	const user = c.get("user") as UserModel

	try {
		const requests = await db
			.select()
			.from(adRequestsTable)
			.where(eq(adRequestsTable.advertiserId, user.tid))
			.orderBy(desc(adRequestsTable.createdAt))

		return c.json(successResponse(requests))
	} catch (error) {
		console.error("Error fetching my ad requests:", error)
		return c.json(errorResponse("Failed to fetch your ad requests", error), 500)
	}
}

// Get single ad request by ID
export const handleGetAdRequestById = async (c: Context) => {
	const id = c.req.param("id")
	const user = c.get("user") as UserModel

	try {
		const [request] = await db
			.select()
			.from(adRequestsTable)
			.where(eq(adRequestsTable.id, Number.parseInt(id, 10)))
			.limit(1)

		if (!request) {
			return c.json(errorResponse("Ad request not found"), 404)
		}

		// Check if user is the advertiser or has a channel applied
		const isAdvertiser = request.advertiserId === user.tid

		const userApplications = await db
			.select()
			.from(adApplicationsTable)
			.innerJoin(
				channelAdminsTable,
				eq(adApplicationsTable.channelId, channelAdminsTable.channelId)
			)
			.where(
				and(
					eq(adApplicationsTable.adRequestId, request.id),
					eq(channelAdminsTable.tgUserId, user.tid)
				)
			)

		const hasApplied = userApplications.length > 0

		return c.json(
			successResponse({
				...request,
				isAdvertiser,
				hasApplied,
			})
		)
	} catch (error) {
		console.error("Error fetching ad request:", error)
		return c.json(errorResponse("Failed to fetch ad request", error), 500)
	}
}

// Update ad request (only advertiser can update)
export const handleUpdateAdRequest = async (c: Context) => {
	const id = c.req.param("id")
	const body = UpdateAdRequestSchema.parse(await parseBody(c))
	const user = c.get("user") as UserModel

	try {
		const [existing] = await db
			.select()
			.from(adRequestsTable)
			.where(eq(adRequestsTable.id, Number.parseInt(id, 10)))
			.limit(1)

		if (!existing) {
			return c.json(errorResponse("Ad request not found"), 404)
		}

		if (existing.advertiserId !== user.tid) {
			return c.json(errorResponse("You can only update your own ad requests"), 403)
		}

		const updateData: Record<string, unknown> = {
			...body,
			updatedAt: new Date(),
		}

		if (body.deadline) {
			updateData.deadline = new Date(body.deadline)
		}

		const [updated] = await db
			.update(adRequestsTable)
			.set(updateData)
			.where(eq(adRequestsTable.id, Number.parseInt(id, 10)))
			.returning()

		return c.json(successResponse(updated))
	} catch (error) {
		console.error("Error updating ad request:", error)
		return c.json(errorResponse("Failed to update ad request", error), 500)
	}
}

// Delete ad request (only advertiser can delete)
export const handleDeleteAdRequest = async (c: Context) => {
	const id = c.req.param("id")
	const user = c.get("user") as UserModel

	try {
		const [existing] = await db
			.select()
			.from(adRequestsTable)
			.where(eq(adRequestsTable.id, Number.parseInt(id, 10)))
			.limit(1)

		if (!existing) {
			return c.json(errorResponse("Ad request not found"), 404)
		}

		if (existing.advertiserId !== user.tid) {
			return c.json(errorResponse("You can only delete your own ad requests"), 403)
		}

		await db.delete(adRequestsTable).where(eq(adRequestsTable.id, Number.parseInt(id, 10)))

		return c.json(successResponse({ message: "Ad request deleted successfully" }))
	} catch (error) {
		console.error("Error deleting ad request:", error)
		return c.json(errorResponse("Failed to delete ad request", error), 500)
	}
}

// Apply to an ad request (channel owner applies)
export const handleApplyToAdRequest = async (c: Context) => {
	const id = c.req.param("id")
	const body = ApplyToAdRequestSchema.parse(await parseBody(c))
	const user = c.get("user") as UserModel

	try {
		const [adRequest] = await db
			.select()
			.from(adRequestsTable)
			.where(eq(adRequestsTable.id, Number.parseInt(id, 10)))
			.limit(1)

		if (!adRequest) {
			return c.json(errorResponse("Ad request not found"), 404)
		}

		if (adRequest.status !== "open") {
			return c.json(errorResponse("This ad request is no longer accepting applications"), 400)
		}

		// Check if user is admin of the channel they're applying with
		const [admin] = await db
			.select()
			.from(channelAdminsTable)
			.where(
				and(
					eq(channelAdminsTable.channelId, body.channelId),
					eq(channelAdminsTable.tgUserId, user.tid)
				)
			)
			.limit(1)

		if (!admin) {
			return c.json(errorResponse("You must be an admin of the channel to apply with it"), 403)
		}

		// Check if already applied
		const [existing] = await db
			.select()
			.from(adApplicationsTable)
			.where(
				and(
					eq(adApplicationsTable.adRequestId, Number.parseInt(id, 10)),
					eq(adApplicationsTable.channelId, body.channelId)
				)
			)
			.limit(1)

		if (existing) {
			return c.json(errorResponse("You have already applied to this request"), 400)
		}

		const [application] = await db
			.insert(adApplicationsTable)
			.values({
				adRequestId: Number.parseInt(id, 10),
				channelId: body.channelId,
			})
			.returning()

		return c.json(successResponse(application))
	} catch (error) {
		console.error("Error applying to ad request:", error)
		return c.json(errorResponse("Failed to apply to ad request", error), 500)
	}
}

// Get applications for an ad request (only advertiser can view)
export const handleGetAdRequestApplications = async (c: Context) => {
	const id = c.req.param("id")
	const user = c.get("user") as UserModel

	try {
		const [adRequest] = await db
			.select()
			.from(adRequestsTable)
			.where(eq(adRequestsTable.id, Number.parseInt(id, 10)))
			.limit(1)

		if (!adRequest) {
			return c.json(errorResponse("Ad request not found"), 404)
		}

		if (adRequest.advertiserId !== user.tid) {
			return c.json(errorResponse("Only the advertiser can view applications"), 403)
		}

		const applications = await db
			.select({
				id: adApplicationsTable.id,
				adRequestId: adApplicationsTable.adRequestId,
				channelId: adApplicationsTable.channelId,
				status: adApplicationsTable.status,
				appliedAt: adApplicationsTable.appliedAt,
				channel: {
					id: channelsTable.id,
					title: channelsTable.title,
					tgId: channelsTable.tgId,
					tgLink: channelsTable.tgLink,
					subCount: channelsTable.subCount,
					avgPostReach: channelsTable.avgPostReach,
				},
			})
			.from(adApplicationsTable)
			.innerJoin(channelsTable, eq(adApplicationsTable.channelId, channelsTable.id))
			.where(eq(adApplicationsTable.adRequestId, Number.parseInt(id, 10)))
			.orderBy(desc(adApplicationsTable.appliedAt))

		return c.json(successResponse(applications))
	} catch (error) {
		console.error("Error fetching applications:", error)
		return c.json(errorResponse("Failed to fetch applications", error), 500)
	}
}

// Accept or reject an application (advertiser only)
export const handleUpdateApplicationStatus = async (c: Context) => {
	const id = c.req.param("id")
	const applicationId = c.req.param("applicationId")
	const { status } = await parseBody(c)
	const user = c.get("user") as UserModel

	try {
		const [adRequest] = await db
			.select()
			.from(adRequestsTable)
			.where(eq(adRequestsTable.id, Number.parseInt(id, 10)))
			.limit(1)

		if (!adRequest) {
			return c.json(errorResponse("Ad request not found"), 404)
		}

		if (adRequest.advertiserId !== user.tid) {
			return c.json(errorResponse("Only the advertiser can update applications"), 403)
		}

		const [updated] = await db
			.update(adApplicationsTable)
			.set({ status })
			.where(
				and(
					eq(adApplicationsTable.id, Number.parseInt(applicationId, 10)),
					eq(adApplicationsTable.adRequestId, Number.parseInt(id, 10))
				)
			)
			.returning()

		if (!updated) {
			return c.json(errorResponse("Application not found"), 404)
		}

		// If accepted, update ad request status to in_progress
		if (status === "accepted") {
			await db
				.update(adRequestsTable)
				.set({ status: "in_progress", updatedAt: new Date() })
				.where(eq(adRequestsTable.id, Number.parseInt(id, 10)))
		}

		return c.json(successResponse(updated))
	} catch (error) {
		console.error("Error updating application status:", error)
		return c.json(errorResponse("Failed to update application status", error), 500)
	}
}
