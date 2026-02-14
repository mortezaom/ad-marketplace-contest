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
	offersCount: number
	adsPublished: number
	listingInfo: {
		postPrice: number
		storyPrice: number
		forwardPrice: number
	}
	isPublic: boolean
}

export interface ChannelDetailResponse {
	channel: ChannelModel
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
