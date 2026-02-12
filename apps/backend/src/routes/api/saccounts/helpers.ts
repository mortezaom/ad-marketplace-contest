import type { User } from "@mtcute/bun"

export const mustEnv = (name: string) => {
	const v = process.env[name]
	if (!v) {
		throw new Error(`Missing env: ${name}`)
	}
	return v
}

export const toIso = (d: Date) => d.toISOString()

export const makeStorageKeyForFlow = (flowId: string) => `storage/stats-agent-flow:${flowId}`

export const mainBotStorageKey = "storage/main-bot-session"

export const meDto = (me: User) => ({
	id: me.id as number,
	firstName: String(me.firstName ?? ""),
	lastName: (me.lastName ?? null) as string | null,
	username: (me.username ?? null) as string | null,
})

export const isPasswordNeededError = (err?: unknown) => {
	const msg = String(err)
	return msg.includes("SESSION_PASSWORD_NEEDED")
}
