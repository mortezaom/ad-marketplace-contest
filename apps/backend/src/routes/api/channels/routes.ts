import { Hono } from "hono"

const app = new Hono()
	.get("/", (c) => {
		return c.json({ users: [] })
	})
	.post("/", async (c) => {
		const body = await c.req.json()
		return c.json({ created: body }, 201)
	})
	.get("/:id", (c) => {
		return c.json({ user: { id: c.req.param("id") } })
	})

export default app
