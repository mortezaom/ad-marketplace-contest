import type { Context } from "hono"

export const parseBody = async (c: Context) => {
	try {
		return await c.req.json()
	} catch {
		return {}
	}
}

export const encodePhotoToken = (fileId: string): string => {
	return Buffer.from(fileId).toString("base64")
}

export const decodePhotoToken = (token: string): string => {
	return Buffer.from(token, "base64").toString("utf-8")
}
