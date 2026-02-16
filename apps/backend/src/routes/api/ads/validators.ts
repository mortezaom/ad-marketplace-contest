import { z } from "zod"

export const CreateAdRequestSchema = z.object({
	title: z.string().min(1).max(200),
	description: z.string().optional(),
	budget: z.number().int().min(0).default(0),
	minSubscribers: z.number().int().min(0).default(0),
	language: z.string().optional(),
	deadline: z.string(), // ISO date string
	adFormat: z.enum(["post", "story", "forward"]).default("post"),
	contentGuidelines: z.string().optional(),
})

export const UpdateAdRequestSchema = z.object({
	title: z.string().min(1).max(200).optional(),
	description: z.string().optional(),
	budget: z.number().int().min(0).optional(),
	minSubscribers: z.number().int().min(0).optional(),
	language: z.string().optional(),
	deadline: z.string().optional(),
	adFormat: z.enum(["post", "story", "forward"]).optional(),
	contentGuidelines: z.string().optional(),
	status: z.enum(["open", "in_progress", "completed", "cancelled"]).optional(),
})

export const ApplyToAdRequestSchema = z.object({
	channelId: z.number().int().positive(),
})

export type CreateAdRequestParam = z.infer<typeof CreateAdRequestSchema>
export type UpdateAdRequestParam = z.infer<typeof UpdateAdRequestSchema>
export type ApplyToAdRequestParam = z.infer<typeof ApplyToAdRequestSchema>

export const GetAdRequestsQuerySchema = z.object({
	status: z.enum(["open", "in_progress", "completed", "cancelled"]).optional(),
	minBudget: z.coerce.number().int().positive().optional(),
	maxBudget: z.coerce.number().int().positive().optional(),
	language: z.string().min(1).optional(),
	adFormat: z.enum(["post", "story", "forward"]).optional(),
})

export type GetAdRequestsQuery = z.infer<typeof GetAdRequestsQuerySchema>
