import { z } from "zod"

// Create zod schema for env variables
const envSchema = z.object({
	DATABASE_URL: z.string(),
	DASH_USER: z.string(),
	DASH_PASS: z.string(),
	JWT_SECRET: z.string(),
	TG_BOT_TOKEN: z.string(),
	BACKEND_PORT: z.coerce.number().min(1000).max(65_535),
	TG_API_ID: z.coerce.number(),
	TG_API_HASH: z.string(),
	TONCENTER_API_KEY: z.string(),
	FRONTEND_ORIGIN: z.string().default("http://localhost:3333"),
})

export function parseENV() {
	try {
		envSchema.parse(Bun.env)
	} catch (err) {
		console.error("Invalid Env variables Configuration::::", err)
		process.exit(1)
	}
}

declare module "bun" {
	interface Env extends z.TypeOf<typeof envSchema> {}
}
