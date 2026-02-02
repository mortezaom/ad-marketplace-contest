import type { UserModel } from "shared"

export const USER_KEY = "user-data"
export const TOKEN_KEY = "auth-token"

function safeJsonParse<T>(value: string): T | null {
	try {
		return JSON.parse(value) as T
	} catch {
		return null
	}
}

export const authStorage = {
	getUser(): UserModel | null {
		if (typeof window === "undefined") {
			return null
		}

		const raw = window.localStorage.getItem(USER_KEY)
		if (!raw) {
			return null
		}

		return safeJsonParse<UserModel>(raw)
	},

	setUser(user: UserModel): void {
		if (typeof window === "undefined") {
			return
		}
		window.localStorage.setItem(USER_KEY, JSON.stringify(user))
	},

	clearUser(): void {
		if (typeof window === "undefined") {
			return
		}
		window.localStorage.removeItem(USER_KEY)
	},
}
