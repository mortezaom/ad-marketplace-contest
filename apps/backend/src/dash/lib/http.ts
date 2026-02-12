import ky, { HTTPError } from "ky"

type ApiExtra = Record<string, unknown>

type SuccessResponse<D, E extends ApiExtra = ApiExtra> = {
	status: "success"
	ok: true
	data: D
} & E

type ErrorResponse<E extends ApiExtra = ApiExtra> = {
	status: "error"
	ok: false
	message: string
} & E

type ApiResult<D, E extends ApiExtra = ApiExtra> =
	| SuccessResponse<D, E>
	| (ErrorResponse<E> & { kind?: "network" | "http" | "bad_response"; statusCode?: number })

function isApiShape(v: unknown): v is { status: "success" | "error" } {
	if (typeof v !== "object" || v === null) {
		return false
	}
	if (!("status" in v)) {
		return false
	}
	const s = (v as { status?: unknown }).status
	return s === "success" || s === "error"
}

const http = ky.create({
	credentials: "include",
	timeout: 200_000,
	retry: { limit: 1 },
	hooks: {
		beforeRequest: [
			(req) => {
				req.headers.set("Accept", "application/json")
			},
		],
	},
})

export async function request<D, E extends ApiExtra = ApiExtra>(
	path: string,
	init?: Parameters<typeof http>[1]
): Promise<ApiResult<D, E>> {
	try {
		const res = await http(path, init)
		let json: unknown
		try {
			json = await res.json()
		} catch {
			return {
				status: "error",
				ok: false,
				kind: "bad_response",
				message: "Response is not JSON",
			} as ApiResult<D, E>
		}

		if (!isApiShape(json)) {
			return {
				status: "error",
				ok: false,
				kind: "bad_response",
				message: "Response shape is not supported",
			} as ApiResult<D, E>
		}

		if (json.status === "success") {
			const s = json as Omit<SuccessResponse<D, E>, "ok">
			return { ...s, ok: true }
		}

		const e = json as Omit<ErrorResponse<E>, "ok">
		return { ...e, ok: false }
	} catch (err) {
		if (err instanceof HTTPError) {
			const statusCode = err.response.status

			let json: unknown
			try {
				json = await err.response.clone().json()
			} catch {
				return {
					status: "error",
					ok: false,
					kind: "http",
					statusCode,
					message: `Request failed (${statusCode})`,
				} as ApiResult<D, E>
			}

			if (isApiShape(json) && json.status === "error") {
				const e = json as Omit<ErrorResponse<E>, "ok">
				return { ...e, ok: false, kind: "http", statusCode }
			}

			return {
				status: "error",
				ok: false,
				kind: "http",
				statusCode,
				message: `Request failed (${statusCode})`,
			} as ApiResult<D, E>
		}

		console.error("Network error:", err)

		return {
			status: "error",
			ok: false,
			kind: "network",
			message: "Network error",
		} as ApiResult<D, E>
	}
}
