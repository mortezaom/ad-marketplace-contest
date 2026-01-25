import { Hono } from "hono"
import { logger } from "hono/logger"
import api from "./routes/api"
import dash from "./routes/dash"

const app = new Hono()

// global middleware
app.use(logger())

// mount routes
app.route("/api", api)
app.route("/dash", dash)

// root redirect
app.get("/", (c) => c.redirect("/dash"))

export default {
	port: process.env.PORT || 3000,
	fetch: app.fetch,
}
