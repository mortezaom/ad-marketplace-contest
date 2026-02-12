import type { Context } from "hono"
import { getCookie } from "hono/cookie"
import { verifyToken } from "./jwt"
import { errorResponse } from "./responses"

export const handleAuth = async (c: Context, next: () => Promise<void>) => {
	const authToken = c.req.header("Authorization")
	if (authToken) {
		const user = await verifyToken(authToken)
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
