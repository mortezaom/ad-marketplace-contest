import { z } from "zod"

export const SubmitChannelParam = z.object({
	channelId: z.number().default(0),
})

export const VerifyChannelParam = z.object({
	channelId: z.string().min(2),
	accountId: z.uuid(),
})

export const AddAdminToChannelParam = z.object({
	newAdminUsername: z.string().min(2),
})
