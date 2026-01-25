import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"

const app = new Hono()

app.use("*", logger())
app.use("*", cors({ origin: "http://localhost:3000" }))

app.get("/", (c) => c.json({ message: "Ad Marketplace API" }))

app.get("/api/health", (c) => c.json({ status: "ok" }))

app.post("/api/ads", (c) => c.json({ id: "1", title: "Sample Ad" }))

app.get("/api/ads", (c) => c.json({ ads: [] }))

export default {
	port: 4000,
	fetch: app.fetch,
}
