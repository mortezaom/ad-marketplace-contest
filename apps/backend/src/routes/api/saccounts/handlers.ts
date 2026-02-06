import { eq } from "drizzle-orm"
import type { Context } from "hono"
import { errorResponse, successResponse } from "@/utils/responses"
import { db } from "../../../db"
import { tgLoginFlows, tgSessions } from "../../../db/schema"
import { isPasswordNeededError, makeClient, makeStorageKeyForFlow, meDto, toIso } from "./helpers"
import { FlowIdParam, StartFlowBody, SubmitCodeBody, SubmitPasswordBody } from "./validators"

const getFlowById = async (flowId: string) => {
	const rows = await db.select().from(tgLoginFlows).where(eq(tgLoginFlows.id, flowId)).limit(1)

	return rows[0] ?? null
}

export const handleStartFlow = async (c: Context) => {
	const body = StartFlowBody.parse(await c.req.json())

	const flowId = crypto.randomUUID()
	const storageKey = makeStorageKeyForFlow(flowId)
	const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

	const tg = makeClient(storageKey)
	await tg.connect()

	const sent = await tg.sendCode({
		phone: body.phone,
		codeSettings: {
			allowFlashcall: false,
			allowMissedCall: false,
			allowFirebase: false,
			allowAppHash: false,
		},
	})

	await tg.disconnect()

	if (sent.type !== "user") {
		await db.insert(tgLoginFlows).values({
			id: flowId,
			mode: "phone",
			status: "waiting_code",
			storageKey,
			phone: body.phone,
			phoneCodeHash: sent.phoneCodeHash,
			expiresAt,
			state: {},
		})
	} else {
		return c.json(errorResponse("cannot use this phone right now"))
	}

	return c.json(
		successResponse({
			flowId,
			step: "enter_code",
			length: sent.length,
			expiresAt: toIso(expiresAt),
		})
	)
}

export const handleSubmitCode = async (c: Context) => {
	const { flowId } = FlowIdParam.parse(c.req.param())
	const body = SubmitCodeBody.parse(await c.req.json())

	const flow = await getFlowById(flowId)

	if (!flow) {
		return c.json(errorResponse("not found"), 404)
	}
	if (flow.mode !== "phone") {
		return c.json(errorResponse("bad mode"), 400)
	}
	if (flow.status !== "waiting_code") {
		return c.json(errorResponse("bad status"), 400)
	}
	if (flow.expiresAt.getTime() < Date.now()) {
		return c.json(errorResponse("expired"), 400)
	}

	const tg = makeClient(flow.storageKey)
	await tg.connect()

	try {
		if (flow.phone && flow.phoneCodeHash) {
			await tg.signIn({
				phone: flow.phone,
				phoneCodeHash: flow.phoneCodeHash,
				phoneCode: body.code,
			})
		} else {
			throw new Error("no phone or hash")
		}
	} catch (e) {
		console.error(e)
		if (isPasswordNeededError(e)) {
			return c.json(successResponse({ step: "enter_password" }))
		}
		await tg.disconnect()
		return c.json(errorResponse("sign in failed"), 400)
	}

	const me = await tg.getMe()

	try {
		await tg.call({
			_: "account.updateProfile",
			firstName: "MiniAd",
			lastName: "Stats",
			about: "Official MiniAd Agent",
		})
	} catch (e) {
		console.error("Failed to update profile", e)
	}

	await tg.disconnect()

	const sessionId = crypto.randomUUID()
	await db.insert(tgSessions).values({
		id: sessionId,
		type: "stats_agent",
		status: "active",
		label: `Agent ${me.id}`,
		storageKey: flow.storageKey,
		tgUserId: `${me.id}`,
		tgUsername: me.username ?? null,
		tgFirstName: me.firstName ?? "",
		tgLastName: me.lastName ?? null,
		isPremium: me.isPremium,
	})

	await db
		.update(tgLoginFlows)
		.set({ status: "done", updatedAt: new Date() })
		.where(eq(tgLoginFlows.id, flowId))

	return c.json(successResponse({ step: "done", me: meDto(me) }))
}

export const handleSubmitPassword = async (c: Context) => {
	const { flowId } = FlowIdParam.parse(c.req.param())
	const body = SubmitPasswordBody.parse(await c.req.json())

	const flow = await getFlowById(flowId)

	if (!flow) {
		return c.json({ error: "not found" }, 404)
	}
	if (flow.mode !== "phone") {
		return c.json({ error: "bad mode" }, 400)
	}
	if (flow.status !== "waiting_password") {
		return c.json({ error: "bad status" }, 400)
	}
	if (flow.expiresAt.getTime() < Date.now()) {
		return c.json({ error: "expired" }, 400)
	}

	const tg = makeClient(flow.storageKey)
	await tg.connect()

	try {
		await tg.checkPassword(body.password)
	} catch {
		await tg.disconnect()
		return c.json(errorResponse("wrong password"), 400)
	}

	const me = await tg.getMe()
	await tg.disconnect()

	await db
		.update(tgLoginFlows)
		.set({ status: "done", updatedAt: new Date() })
		.where(eq(tgLoginFlows.id, flowId))

	return c.json(successResponse({ step: "done", me: meDto(me) }))
}

export const handleGetList = async (c: Context) => {
	try {
		const data = await db.select().from(tgSessions)

		return c.json(successResponse(data))
	} catch (error) {
		console.error(error)
		return c.json(errorResponse(String(error)), 500)
	}
}
