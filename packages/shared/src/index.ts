export interface UserModel {
	id: number
	tid: number
	first_name: string
	last_name: string | null
	photo_url: string | null
	username: string | null
	created_at: Date
}

export interface LanguageStats {
	name: string
	total: number
}

export interface ChannelModel {
	title: string | null
	tgId: string
	tgLink: string
	subCount: number
	avgPostReach?: number | undefined
	languages: LanguageStats[]
}

export interface ChannelDetailResponse {
	channel: {
		title: string | null
		tgId: string
		tgLink: string
		subCount: number
		avgPostReach: number
		languages: { code: string; name: string; percentage: number }[]
		offersCount: number
		adsPublished: number
	}
	weeklyStats: { day: string; posts: number }[]
}

export interface AdminWithUser {
	id: number
	tgUserId: number
	role: "owner" | "admin"
	addedAt: Date
	source: "telegram" | "manual"
	user: {
		tid: number
		first_name: string
		last_name: string | null
		photo_url: string | null
		username: string | null
	}
}
