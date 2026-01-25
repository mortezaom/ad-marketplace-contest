export type User = {
	id: string
	telegramId: number
	username?: string
	role: "buyer" | "seller" | "admin"
}

export type Ad = {
	id: string
	title: string
	description: string
	price: number
	sellerId: string
	createdAt: string
	images: string[]
	category: string
}

export type ApiResponse<T> = {
	success: boolean
	data?: T
	error?: string
	timestamp: string
}
