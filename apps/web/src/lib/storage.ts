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

	setToken(token: string): void {
		if (typeof window === "undefined") {
			return
		}
		window.localStorage.setItem(TOKEN_KEY, token)
	},

	getToken(): string | null {
		if (typeof window === "undefined") {
			return null
		}
		return window.localStorage.getItem(TOKEN_KEY)
	},

	setClosedIntro() {
		if (typeof window === "undefined") {
			return
		}
		const key = "intro-closed"
		if (!window.localStorage.getItem(key)) {
			window.localStorage.setItem(key, "true")
		}
	},

	getClosedIntro(): boolean {
		if (typeof window === "undefined") {
			return false
		}
		return !!window.localStorage.getItem("intro-closed")
	},
}
