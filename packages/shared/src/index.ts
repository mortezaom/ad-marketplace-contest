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

// ─── Deal Types ──────────────────────────────────────────────────────

export type DealStatus =
	| "awaiting_creative"
	| "creative_submitted"
	| "awaiting_payment"
	| "scheduled"
	| "posted"
	| "completed"
	| "cancelled"

export interface DealModel {
	id: number
	applicationId: number
	channelId: number
	advertiserId: number
	adFormat: AdFormat
	agreedPrice: number
	status: DealStatus
	scheduledPostAt: Date | null
	minPostDurationHours: number
	completedAt: Date | null
	cancelledAt: Date | null
	createdAt: Date
	updatedAt: Date
}

export interface DealWithDetails extends DealModel {
	channel: {
		id: number
		title: string | null
		tgId: string
		tgLink: string
		subCount: number
		avgPostReach: number
	}
	adRequest: {
		id: number
		title: string
		description: string | null
	}
	application: {
		id: number
		status: AdApplicationStatus
	}
}

export interface CreateDealPayload {
	applicationId: number
	channelId: number
	adFormat: AdFormat
	agreedPrice: number
	scheduledPostAt?: Date
	minPostDurationHours?: number
}

export interface UpdateDealPayload {
	status?: DealStatus
	scheduledPostAt?: Date
	minPostDurationHours?: number
}

// ─── Creative Types ──────────────────────────────────────────────────────

export type CreativeStatus = "draft" | "submitted" | "approved" | "revision_requested"

export interface CreativeModel {
	id: number
	dealId: number
	version: number
	content: string
	mediaUrls: string[]
	status: CreativeStatus
	submittedAt: Date | null
	reviewedAt: Date | null
	createdAt: Date
}

export interface CreateCreativePayload {
	dealId: number
	content: string
	mediaUrls?: string[]
}

export interface UpdateCreativePayload {
	content?: string
	mediaUrls?: string[]
	status?: CreativeStatus
}

// ─── Feedback Types ──────────────────────────────────────────────────────

export interface SendFeedbackPayload {
	message: string
}
