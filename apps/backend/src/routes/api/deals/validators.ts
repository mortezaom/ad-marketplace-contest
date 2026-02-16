import { z } from "zod"

export const UpdateDealSchema = z
	.object({
		status: z
			.enum([
				"awaiting_creative",
				"creative_submitted",
				"awaiting_payment",
				"scheduled",
				"posted",
				"completed",
				"cancelled",
			])
			.optional(),
		scheduledPostAt: z.string().datetime().optional(),
		minPostDurationHours: z.number().int().positive().optional(),
	})
	.partial()

export const GetWalletForDealSchema = z.object({
	userWallet: z.string().min(10),
})
