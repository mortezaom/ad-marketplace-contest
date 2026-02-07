import { z } from "zod"

export const SubmitChannelParam = z.object({
	channelId: z.bigint(),
})

export const VerifyChannelParam = z.object({
	channelId: z.string(),
	accountId: z.uuid(),
})
