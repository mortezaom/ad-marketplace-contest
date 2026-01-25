import { Hono } from "hono"

const app = new Hono().get("/", (c) => c.json({ ok: true, time: Date.now() }))

export default app
