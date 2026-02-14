import ky, { HTTPError } from "ky"
import { authStorage } from "./storage"

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
	prefixUrl: process.env.NEXT_PUBLIC_API_URL,
	credentials: "include",
	timeout: 200_000,
	retry: { limit: 1 },
	hooks: {
		beforeRequest: [
			(req) => {
				req.headers.set("Accept", "application/json")
				req.headers.set("Content-Type", "application/json")
				const token = authStorage.getToken()
				if (token) {
					req.headers.set("Authorization", `Bearer ${token}`)
				}
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

export const getChannelPhoto = (tgLink: string) => {
	console.log(`${process.env.NEXT_PUBLIC_API_URL}channels/channel-photo/${tgLink.split("/").pop()}`)
	return `${process.env.NEXT_PUBLIC_API_URL}channels/channel-photo/${tgLink.split("/").pop()}`
}

// Ad Request API functions with filters
export const createAdRequest = (data: {
	title: string
	description?: string
	budget: number
	minSubscribers?: number
	language?: string
	deadline?: string
	adFormat?: "post" | "story" | "forward"
	contentGuidelines?: string
}) => request("ads", { method: "POST", json: data })

export const getAdRequests = (filters?: {
	status?: "open" | "in_progress" | "completed" | "cancelled"
	minBudget?: number
	maxBudget?: number
	language?: string
	adFormat?: "post" | "story" | "forward"
}) => {
	const params = new URLSearchParams()
	if (filters?.status) params.set("status", filters.status)
	if (filters?.minBudget) params.set("minBudget", filters.minBudget.toString())
	if (filters?.maxBudget) params.set("maxBudget", filters.maxBudget.toString())
	if (filters?.language) params.set("language", filters.language)
	if (filters?.adFormat) params.set("adFormat", filters.adFormat)

	const queryString = params.toString()
	return request(`ads${queryString ? `?${queryString}` : ""}`)
}

export const getMyAdRequests = () => request("ads/my-ads")

export const getAdRequest = (id: number) => request(`ads/${id}`)

export const updateAdRequest = (
	id: number,
	data: {
		title?: string
		description?: string
		budget?: number
		minSubscribers?: number
		language?: string
		deadline?: string
		adFormat?: "post" | "story" | "forward"
		contentGuidelines?: string
		status?: "open" | "in_progress" | "completed" | "cancelled"
	}
) => request(`ads/${id}`, { method: "PUT", json: data })

export const deleteAdRequest = (id: number) => request(`ads/${id}`, { method: "DELETE" })

export const applyToAdRequest = (id: number, channelId: number) =>
	request(`ads/${id}/apply`, { method: "POST", json: { channelId } })

export const getAdRequestApplications = (id: number) => request(`ads/${id}/applications`)

export const updateApplicationStatus = (
	id: number,
	applicationId: number,
	status: "pending" | "accepted" | "rejected"
) => request(`ads/${id}/applications/${applicationId}`, { method: "POST", json: { status } })
