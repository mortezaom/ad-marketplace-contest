import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { startMainBot } from "./bot"
import { parseENV } from "./config/env"
import api from "./routes/api"
import dash from "./routes/dash"

parseENV()

const allowedOrigins = new Set(["http://wsl.localhost:3333", Bun.env.FRONTEND_ORIGIN])

startMainBot().catch((err) => {
	console.error("Failed to start bot:", err)
})

const app = new Hono()

// global middleware
app.use(logger())

app.use(
	"/api/*",
	cors({
		origin: (origin) => {
			if (!origin) {
				return undefined
			}
			return allowedOrigins.has(origin) ? origin : undefined
		},
		credentials: true,
		allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
	})
)
// mount routes
app.route("/api", api)
app.route("/dash", dash)

// root redirect
app.get("/", (c) => c.redirect("/dash"))

export default {
	port: process.env.BACKEND_PORT || 3000,
	fetch: app.fetch,
}
