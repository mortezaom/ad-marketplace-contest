import type { Context } from "hono"
import { getCookie } from "hono/cookie"
import { TOKEN_COOKIE, verifyToken } from "./jwt"
import { errorResponse } from "./responses"

export const handleAuth = async (c: Context, next: () => Promise<void>) => {
	const authToken = getCookie(c, TOKEN_COOKIE)
	if (authToken) {
		const user = verifyToken(authToken)
		c.set("user", user)
	} else {
		return c.json(errorResponse("Unauthorized!"), 401)
	}
	await next()
}
