import { Hono } from "hono"
import { getCookie, setCookie } from "hono/cookie"

const AUTH_USER = process.env.DASH_USER || "admin"
const AUTH_PASS = process.env.DASH_PASS || "secret"

const app = new Hono()
	.post("/login", async (c) => {
		const { user, pass } = await c.req.json()
		if (user === AUTH_USER && pass === AUTH_PASS) {
			setCookie(c, "dash_auth", "authenticated", {
				httpOnly: true,
				maxAge: 86_400,
			})
			return c.json({ ok: true })
		}
		return c.json({ ok: false }, 401)
	})
	.get("/logout", (c) => {
		setCookie(c, "dash_auth", "", { maxAge: 0 })
		return c.redirect("/dash/login")
	})
	.get("/check", (c) => {
		const token = getCookie(c, "dash_auth")
		return c.json({ authenticated: token === "authenticated" })
	})

export default app
