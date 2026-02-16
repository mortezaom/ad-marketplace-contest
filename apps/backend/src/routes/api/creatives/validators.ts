import { z } from "zod"

export const CreateCreativeSchema = z.object({
	content: z.string().min(1),
	mediaUrls: z.array(z.string()).optional(),
})

export const UpdateCreativeSchema = z
	.object({
		content: z.string().min(1).optional(),
		mediaUrls: z.array(z.string()).optional(),
		status: z.enum(["draft", "submitted", "approved", "revision_requested"]).optional(),
		reviewNote: z.string().optional(),
	})
	.partial()

export type CreateCreativeParam = z.infer<typeof CreateCreativeSchema>
export type UpdateCreativeParam = z.infer<typeof UpdateCreativeSchema>
