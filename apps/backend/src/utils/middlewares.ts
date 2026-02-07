import type { Context } from "hono"
import { getCookie } from "hono/cookie"
import { TOKEN_COOKIE, verifyToken } from "./jwt"
import { errorResponse } from "./responses"

export const handleAuth = (c: Context, next: () => Promise<void>) => {
	const authToken = getCookie(c, TOKEN_COOKIE)
	if (authToken) {
		const user = verifyToken(authToken)
		c.set("user", user)
	} else {
		return c.json(errorResponse("Unauthorized!"), 401)
	}
	return next()
}

export const handleDashAuth = (c: Context, next: () => Promise<void>) => {
	const token = getCookie(c, "dash_auth")
	if (token === "authenticated") {
		return next()
	}
	return c.json(errorResponse("Unauthorized!"), 401)
}
