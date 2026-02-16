import { z } from "zod"

export const SendFeedbackSchema = z.object({
	message: z.string().min(1).max(1000),
})

export type SendFeedbackParam = z.infer<typeof SendFeedbackSchema>
