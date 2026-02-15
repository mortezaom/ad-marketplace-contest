import { sign, verify } from "hono/jwt"

export const TOKEN_ALIVE = 12 * 60 * 60 // 12 hours * 60 mins * 60 secs

export const generateToken = async (payload: object): Promise<string> => {
	const secret = Bun.env.JWT_SECRET
	return await sign(
		{ ...payload, exp: Math.floor(Date.now() / 1000) + TOKEN_ALIVE },
		secret,
		"HS256"
	)
}

export const verifyToken = async (token: string): Promise<object | null> => {
	const secret = Bun.env.JWT_SECRET

	const tokenWithoutBearer = token.replace("Bearer ", "")

	try {
		const payload = await verify(tokenWithoutBearer, secret, "HS256")
		if (!payload || (payload.exp && Date.now() / 1000 > payload.exp)) {
			throw new Error("Token expired!")
		}
		return payload
	} catch (err) {
		console.error("Token verification failed::::", err)
		return null
	}
}
