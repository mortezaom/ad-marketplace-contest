import { parse, validate } from "@tma.js/init-data-node"
import { eq } from "drizzle-orm"
import type { Context } from "hono"
import type { UserModel } from "shared"
import { db } from "@/db"
import { usersTable } from "@/db/schema"
import { generateToken } from "@/utils/jwt"
import { errorResponse, successResponse } from "@/utils/responses"
import { AuthBodySchema } from "./validators"

const BOT_TOKEN = Bun.env.TG_BOT_TOKEN

// get initData and generate jwt auth token
export const handleUserAuth = async (c: Context) => {
	const body = await c.req.json().catch(() => null)

	const parsedBody = AuthBodySchema.safeParse(body)

	if (!parsedBody.success) {
		return c.json({ error: "initData is required" }, 400)
	}

	const { initData } = parsedBody.data

	try {
		validate(initData, BOT_TOKEN, { expiresIn: 3600 })
		const data = parse(initData)

		const tUser = data.user

		if (!tUser?.id) {
			return c.json(errorResponse("No user in initData"), 400)
		}

		const savedUser = await db
			.insert(usersTable)
			.values({
				tid: tUser.id,
				first_name: tUser.first_name,
				last_name: tUser.last_name,
				username: tUser.username,
				photo_url: tUser.photo_url,
			})
			.onConflictDoUpdate({
				target: usersTable.tid,
				set: {
					tid: usersTable.tid,
					first_name: tUser.first_name,
					last_name: tUser.last_name,
					username: tUser.username,
					photo_url: tUser.photo_url,
					updated_at: new Date(),
				},
			})
			.returning()

		const accessToken = await generateToken(savedUser[0])

		return c.json(
			successResponse({
				user: savedUser[0],
				accessToken,
			})
		)
	} catch (err) {
		return c.json(errorResponse("Invalid initData", err), 401)
	}
}

// get user info
export const handleGetUserInfo = async (c: Context) => {
	try {
		const user = c.get("user") as UserModel

		const savedUser = await db.select().from(usersTable).where(eq(usersTable.id, user.id))

		return c.json(successResponse(savedUser[0]))
	} catch (err) {
		return c.json(errorResponse(`${err}`), 401)
	}
}
