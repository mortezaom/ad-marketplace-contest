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
	id: number
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

// Ad Request types for advertiser campaign requests
export type AdFormat = "post" | "story" | "forward"
export type AdRequestStatus = "open" | "in_progress" | "completed" | "cancelled"
export type AdApplicationStatus = "pending" | "accepted" | "rejected"

export interface AdRequestModel {
	id: number
	title: string
	description: string | null
	budget: number
	minSubscribers: number
	language: string | null
	deadline: Date | null
	adFormat: AdFormat
	contentGuidelines: string | null
	advertiserId: number
	status: AdRequestStatus
	createdAt: Date
	updatedAt: Date
}

export interface AdApplicationModel {
	id: number
	adRequestId: number
	channelId: number
	status: AdApplicationStatus
	appliedAt: Date
	// Populated when joined with channel data
	channel?: {
		id: number
		title: string | null
		tgId: string
		tgLink: string
		subCount: number
		avgPostReach: number
	}
}

export interface AdRequestWithApplications extends AdRequestModel {
	applications: AdApplicationModel[]
}

export interface CreateAdRequestPayload {
	title: string
	description?: string
	budget: number
	minSubscribers?: number
	language?: string
	deadline?: Date
	adFormat?: AdFormat
	contentGuidelines?: string
}

export interface UpdateAdRequestPayload {
	title?: string
	description?: string
	budget?: number
	minSubscribers?: number
	language?: string
	deadline?: Date
	adFormat?: AdFormat
	contentGuidelines?: string
	status?: AdRequestStatus
}
