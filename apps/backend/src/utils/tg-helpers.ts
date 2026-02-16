import { mkdirSync } from "node:fs"
import { SqliteStorage, TelegramClient } from "@mtcute/bun"
import { mainBot } from "@/bot"

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

export const makeBotClient = () => {
	const { apiId, apiHash } = getTelegramCreds()
	const botToken = Bun.env.TG_BOT_TOKEN

	if (!botToken) {
		throw new Error("Bot token is not set in environment variables")
	}

	return new TelegramClient({
		apiId,
		apiHash,
	})
}

export const withDelay = async <T>(fn: () => Promise<T>, delay = 1000): Promise<T> => {
	await new Promise((resolve) => setTimeout(resolve, delay))
	return await fn()
}

export const setMessageToConversation = async (message: string, peerId: number) => {
	await mainBot.sendText(peerId, message)
}
