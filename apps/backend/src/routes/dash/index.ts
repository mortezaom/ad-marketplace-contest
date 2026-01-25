import { Hono } from "hono"
import { serveStatic } from "hono/bun"
import { getCookie } from "hono/cookie"
import auth from "./auth"

const isDev = process.env.NODE_ENV !== "production"

const app = new Hono()

// auth routes
app.route("/auth", auth)

if (isDev) {
	app.get("/static/:file{.+\\.tsx?$}", async (c) => {
		const file = c.req.param("file")
		const result = await Bun.build({
			entrypoints: [`./src/dash/${file}`],
			format: "esm",
		})
		return c.text(await result.outputs[0].text(), 200, {
			"Content-Type": "application/javascript",
		})
	})

	app.get("/static/styles.css", async (c) => {
		return c.text(await Bun.file("./src/dash/styles.css").text(), 200, {
			"Content-Type": "text/css",
		})
	})
}

// static files
app.use("/static/*", serveStatic({ root: isDev ? "./src" : "./dist" }))

// SPA with auth check
app.get("/*", async (c) => {
	const token = getCookie(c, "dash_auth")
	const isLoginPage = c.req.path === "/dash/login"

	if (token !== "authenticated" && !isLoginPage) {
		return c.redirect("/dash/login")
	}

	const htmlPath = isDev ? "./src/dash/index.html" : "./dist/dash/index.html"
	return c.html(await Bun.file(htmlPath).text())
})

export default app
