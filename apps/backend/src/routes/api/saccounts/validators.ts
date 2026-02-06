import { z } from "zod"

export const FlowIdParam = z.object({
	flowId: z.uuid(),
})
export type FlowIdParam = z.infer<typeof FlowIdParam>

export const StartFlowBody = z.object({
	phone: z.string().trim().min(6).max(32),
})
export type StartFlowBody = z.infer<typeof StartFlowBody>

export const SubmitCodeBody = z.object({
	code: z.string().trim().min(3).max(10),
})
export type SubmitCodeBody = z.infer<typeof SubmitCodeBody>

export const SubmitPasswordBody = z.object({
	password: z.string().min(1),
})
export type SubmitPasswordBody = z.infer<typeof SubmitPasswordBody>

export const FinalizeBody = z.object({
	label: z.string().trim().min(1).max(64).optional(),
})
export type FinalizeBody = z.infer<typeof FinalizeBody>

export const MeDto = z.object({
	id: z.number(),
	firstName: z.string(),
	lastName: z.string().nullable(),
	username: z.string().nullable(),
})
export type MeDto = z.infer<typeof MeDto>

export const StartFlowResponse = z.object({
	flowId: z.uuid(),
	step: z.literal("enter_code"),
	expiresAt: z.iso.datetime(),
})
export type StartFlowResponse = z.infer<typeof StartFlowResponse>

export const SubmitCodeResponse = z.discriminatedUnion("step", [
	z.object({
		step: z.literal("enter_password"),
	}),
	z.object({
		step: z.literal("done"),
		me: MeDto,
	}),
])
export type SubmitCodeResponse = z.infer<typeof SubmitCodeResponse>

export const SubmitPasswordResponse = z.object({
	step: z.literal("done"),
	me: MeDto,
})
export type SubmitPasswordResponse = z.infer<typeof SubmitPasswordResponse>

export const FinalizeResponse = z.object({
	sessionId: z.uuid(),
})
export type FinalizeResponse = z.infer<typeof FinalizeResponse>
