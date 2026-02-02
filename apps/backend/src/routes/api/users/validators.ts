import { z } from "zod"

export const AuthBodySchema = z.object({
	initData: z.string().min(10),
})
