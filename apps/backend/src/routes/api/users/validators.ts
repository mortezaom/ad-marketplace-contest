import { z } from "zod"

export const AuthBodySchema = z.object({
	initData: z.string().min(10),
})

export const SaveWalletSchema = z.object({
	walletAddress: z.string().min(10),
})
