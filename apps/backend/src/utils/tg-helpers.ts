import { mkdirSync } from "node:fs"
import { SqliteStorage, TelegramClient } from "@mtcute/bun"

export const getTelegramCreds = () => ({
	apiId: Bun.env.TG_API_ID,
	apiHash: Bun.env.TG_API_HASH,
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

export const withDelay = async <T>(fn: () => Promise<T>, delay = 1000): Promise<T> => {
	await new Promise((resolve) => setTimeout(resolve, delay))
	return await fn()
}
