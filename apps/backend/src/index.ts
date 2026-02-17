import { Hono } from "hono"
import { cors } from "hono/cors"
import { startMainBot } from "./bot"
import { parseENV } from "./config/env"
import api from "./routes/api"
import dash from "./routes/dash"

parseENV()

startMainBot().catch((err) => {
	console.error("Failed to start bot:", err)
})

const app = new Hono()

// global middleware
// app.use(logger())

app.use(cors())
// mount routes
app.route("/api", api)
app.route("/dash", dash)

// root redirect
app.get("/", (c) => c.redirect("/dash"))

export default {
	port: process.env.BACKEND_PORT || 3000,
	fetch: app.fetch,
}
