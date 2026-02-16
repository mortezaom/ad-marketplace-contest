import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm"
import type { Context } from "hono"
import type { UserModel } from "shared"
import { db } from "@/db"
import {
	adApplicationsTable,
	adRequestsTable,
	channelAdminsTable,
	channelsTable,
	dealsTable,
} from "@/db/schema"
import { parseBody } from "@/utils/helpers"
import { errorResponse, successResponse } from "@/utils/responses"
import {
	ApplyToAdRequestSchema,
	CreateAdRequestSchema,
	GetAdRequestsQuerySchema,
	UpdateAdRequestSchema,
} from "./validators"

const paramInt = (c: Context, name: string) => Number.parseInt(c.req.param(name), 10)

const getAdRequestOrFail = async (id: number) => {
	const [request] = await db
		.select()
		.from(adRequestsTable)
		.where(eq(adRequestsTable.id, id))
		.limit(1)
	return request ?? null
}

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

export const handleGetAdRequests = async (c: Context) => {
	try {
		const user = c.get("user") as UserModel

		const userChannels = await db
			.select({ channelId: channelAdminsTable.channelId })
			.from(channelAdminsTable)
			.where(eq(channelAdminsTable.tgUserId, user.tid))

		const hasChannels = userChannels.length > 0

		const url = new URL(c.req.url)
		const query = GetAdRequestsQuerySchema.parse(Object.fromEntries(url.searchParams))

		const conditions: SQL[] = []

		if (hasChannels) {
			conditions.push(eq(adRequestsTable.status, query.status ?? "open"))
		} else {
			conditions.push(eq(adRequestsTable.advertiserId, user.tid))
			if (query.status) {
				conditions.push(eq(adRequestsTable.status, query.status))
			}
		}

		if (query.minBudget) {
			conditions.push(gte(adRequestsTable.budget, query.minBudget))
		}
		if (query.maxBudget) {
			conditions.push(lte(adRequestsTable.budget, query.maxBudget))
		}
		if (query.language) {
			conditions.push(eq(adRequestsTable.language, query.language))
		}
		if (query.adFormat) {
			conditions.push(eq(adRequestsTable.adFormat, query.adFormat))
		}

		const requests = await db
			.select()
			.from(adRequestsTable)
			.where(and(...conditions))
			.orderBy(desc(adRequestsTable.createdAt))

		if (!hasChannels) {
			const processedRequests = requests.map((r) => ({
				...r,
				isOwn: true,
				hasApplied: false,
			}))
			return c.json(
				successResponse({
					requests: processedRequests,
					filters: { hasChannels, total: processedRequests.length },
				})
			)
		}

		const appliedSet = new Set<number>()

		if (requests.length > 0) {
			const applications = await db
				.select({ adRequestId: adApplicationsTable.adRequestId })
				.from(adApplicationsTable)
				.innerJoin(
					channelAdminsTable,
					eq(adApplicationsTable.channelId, channelAdminsTable.channelId)
				)
				.where(eq(channelAdminsTable.tgUserId, user.tid))

			for (const app of applications) {
				appliedSet.add(app.adRequestId)
			}
		}

		const processedRequests = requests.map((r) => ({
			...r,
			isOwn: r.advertiserId === user.tid,
			hasApplied: appliedSet.has(r.id),
		}))

		return c.json(
			successResponse({
				requests: processedRequests,
				filters: { hasChannels, total: processedRequests.length },
			})
		)
	} catch (error) {
		console.error("Error fetching ad requests:", error)
		return c.json(errorResponse("Failed to fetch ad requests", error), 500)
	}
}

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

export const handleGetAdRequestById = async (c: Context) => {
	const id = paramInt(c, "id")
	const user = c.get("user") as UserModel

	try {
		const request = await getAdRequestOrFail(id)
		if (!request) {
			return c.json(errorResponse("Ad request not found"), 404)
		}

		const [userApplication] = await db
			.select({ id: adApplicationsTable.id })
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
			.limit(1)

		return c.json(
			successResponse({
				...request,
				isAdvertiser: request.advertiserId === user.tid,
				hasApplied: !!userApplication,
			})
		)
	} catch (error) {
		console.error("Error fetching ad request:", error)
		return c.json(errorResponse("Failed to fetch ad request", error), 500)
	}
}

export const handleUpdateAdRequest = async (c: Context) => {
	const id = paramInt(c, "id")
	const body = UpdateAdRequestSchema.parse(await parseBody(c))
	const user = c.get("user") as UserModel

	try {
		const existing = await getAdRequestOrFail(id)
		if (!existing) {
			return c.json(errorResponse("Ad request not found"), 404)
		}

		// try {
		// 	assertOwnership(existing.advertiserId, user.tid, "update")
		// } catch (e: any) {
		// 	return c.json(errorResponse(e.message), e.status)
		// }
		const { message } = assertOwnership(existing.advertiserId, user.tid, "update")
		if (message) {
			return c.json(errorResponse(message), 403)
		}

		const [updated] = await db
			.update(adRequestsTable)
			.set({
				...body,
				deadline: body.deadline ? new Date(body.deadline) : undefined,
				updatedAt: new Date(),
			})
			.where(eq(adRequestsTable.id, id))
			.returning()

		return c.json(successResponse(updated))
	} catch (error) {
		console.error("Error updating ad request:", error)
		return c.json(errorResponse("Failed to update ad request", error), 500)
	}
}

export const handleDeleteAdRequest = async (c: Context) => {
	const id = paramInt(c, "id")
	const user = c.get("user") as UserModel

	try {
		const existing = await getAdRequestOrFail(id)
		if (!existing) {
			return c.json(errorResponse("Ad request not found"), 404)
		}

		const { message } = assertOwnership(existing.advertiserId, user.tid, "delete")
		if (message) {
			return c.json(errorResponse(message), 403)
		}

		await db.delete(adRequestsTable).where(eq(adRequestsTable.id, id))

		return c.json(successResponse({ message: "Ad request deleted" }))
	} catch (error) {
		console.error("Error deleting ad request:", error)
		return c.json(errorResponse("Failed to delete ad request", error), 500)
	}
}

export const handleApplyToAdRequest = async (c: Context) => {
	const id = paramInt(c, "id")
	const body = ApplyToAdRequestSchema.parse(await parseBody(c))
	const user = c.get("user") as UserModel

	try {
		const adRequest = await getAdRequestOrFail(id)
		if (!adRequest) {
			return c.json(errorResponse("Ad request not found"), 404)
		}

		if (adRequest.status !== "open") {
			return c.json(errorResponse("This ad request is no longer accepting applications"), 400)
		}

		const [admin] = await db
			.select({ channelId: channelAdminsTable.channelId })
			.from(channelAdminsTable)
			.where(
				and(
					eq(channelAdminsTable.channelId, body.channelId),
					eq(channelAdminsTable.tgUserId, user.tid)
				)
			)
			.limit(1)

		if (!admin) {
			return c.json(errorResponse("You must be an admin of the channel to apply"), 403)
		}

		const [existing] = await db
			.select({ id: adApplicationsTable.id })
			.from(adApplicationsTable)
			.where(
				and(
					eq(adApplicationsTable.adRequestId, id),
					eq(adApplicationsTable.channelId, body.channelId)
				)
			)
			.limit(1)

		if (existing) {
			return c.json(errorResponse("You have already applied to this request"), 400)
		}

		const [application] = await db
			.insert(adApplicationsTable)
			.values({ adRequestId: id, channelId: body.channelId })
			.returning()

		return c.json(successResponse(application))
	} catch (error) {
		console.error("Error applying to ad request:", error)
		return c.json(errorResponse("Failed to apply to ad request", error), 500)
	}
}

export const handleGetAdRequestApplications = async (c: Context) => {
	const id = paramInt(c, "id")
	const user = c.get("user") as UserModel

	try {
		const adRequest = await getAdRequestOrFail(id)
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
					languages: channelsTable.languages,
				},
			})
			.from(adApplicationsTable)
			.innerJoin(channelsTable, eq(adApplicationsTable.channelId, channelsTable.id))
			.where(eq(adApplicationsTable.adRequestId, id))
			.orderBy(desc(adApplicationsTable.appliedAt))

		const formatedResponse = applications.map(({ channel, ...rest }) => {
			return {
				...rest,
				channel: {
					...channel,
					languages: channel.languages ? JSON.parse(channel.languages) : [],
				},
			}
		})

		return c.json(successResponse(formatedResponse))
	} catch (error) {
		console.error("Error fetching applications:", error)
		return c.json(errorResponse("Failed to fetch applications", error), 500)
	}
}

export const handleUpdateApplicationStatus = async (c: Context) => {
	const id = paramInt(c, "id")
	const applicationId = paramInt(c, "applicationId")
	const { status } = (await parseBody(c)) as {
		status: "accepted" | "rejected"
	}
	const user = c.get("user") as UserModel

	try {
		const adRequest = await getAdRequestOrFail(id)
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
				and(eq(adApplicationsTable.id, applicationId), eq(adApplicationsTable.adRequestId, id))
			)
			.returning()

		if (!updated) {
			return c.json(errorResponse("Application not found"), 404)
		}

		if (status === "accepted") {
			await db
				.update(adRequestsTable)
				.set({ status: "in_progress", updatedAt: new Date() })
				.where(eq(adRequestsTable.id, id))

			await db
				.insert(dealsTable)
				.values({
					adFormat: adRequest.adFormat,
					advertiserId: adRequest.advertiserId,
					agreedPrice: adRequest.budget,
					applicationId: updated.id,
					channelId: updated.channelId,
					scheduledPostAt: adRequest.deadline,
				})
				.execute()
		}

		return c.json(successResponse(updated))
	} catch (error) {
		console.error("Error updating application status:", error)
		return c.json(errorResponse("Failed to update application status", error), 500)
	}
}

const assertOwnership = (
	advertiserId: number,
	userTid: number,
	action: string
): { message: string | undefined } => {
	if (advertiserId !== userTid) {
		return {
			message: `You can only ${action} your own ad requests`,
		}
	}
	return { message: undefined }
}
