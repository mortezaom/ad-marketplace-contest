import { mkdirSync } from "node:fs"
import { SqliteStorage, TelegramClient, type User } from "@mtcute/bun"

export const mustEnv = (name: string) => {
	const v = process.env[name]
	if (!v) {
		throw new Error(`Missing env: ${name}`)
	}
	return v
}

export const toIso = (d: Date) => d.toISOString()

export const makeStorageKeyForFlow = (flowId: string) => `storage/stats-agent-flow:${flowId}`

export const getTelegramCreds = () => ({
	apiId: Number(mustEnv("TG_API_ID")),
	apiHash: mustEnv("TG_API_HASH"),
})

export const makeClient = (storageKey: string) => {
	const { apiId, apiHash } = getTelegramCreds()

	mkdirSync("storage", {
		recursive: true,
	})

	return new TelegramClient({
		apiId,
		apiHash,
		storage: new SqliteStorage(storageKey),
	})
}

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
