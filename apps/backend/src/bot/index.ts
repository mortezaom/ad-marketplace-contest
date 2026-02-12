import { Dispatcher, filters } from "@mtcute/dispatcher"
import { mainBotStorageKey } from "@/routes/api/saccounts/helpers"
import { makeClient } from "@/utils/tg-helpers"

export const mainBot = makeClient(mainBotStorageKey)

const dp = Dispatcher.for(mainBot)

dp.onNewMessage(filters.command("start"), async (msg) => {
	await msg.answerText("Hello! I am the backend media bot.")
})

dp.onNewMessage((msg) => {
	console.log("New message:", msg.text)
})

export const startMainBot = async () => {
	const user = await mainBot.start({
		botToken: Bun.env.TG_BOT_TOKEN,
	})

	console.log(`Main Bot started as @${user.username}`)
	return mainBot
}
