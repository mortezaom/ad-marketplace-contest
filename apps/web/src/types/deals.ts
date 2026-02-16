import type { AdFormat, CreativeStatus, DealStatus } from "shared"

export interface DealListItem {
	id: number
	applicationId: number
	channelId: number
	advertiserId: number
	adFormat: AdFormat
	agreedPrice: number
	status: DealStatus
	scheduledPostAt: string | null
	minPostDurationHours: number
	completedAt: string | null
	cancelledAt: string | null
	createdAt: string
	updatedAt: string
	channel: {
		title: string | null
		tgLink: string
		subCount: number
	}
	adRequest: {
		id: number
		title: string
	}
	userRole: "advertiser" | "channel_owner"
}

export interface DealDetail extends DealListItem {
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
		budget: number
		contentGuidelines: string | null
	}
	application: {
		id: number
		status: string
	}
	advertiser: {
		id: number
		firstName: string
		lastName: string | null
		username: string | null
		photo_url?: string | null
	}
	creative: CreativeDetail | null
}

export interface CreativeDetail {
	id: number
	dealId: number
	version: number
	content: string
	mediaUrls: string[]
	status: CreativeStatus
	reviewNote: string | null
	submittedAt: string | null
	reviewedAt: string | null
	createdAt: string
}

export interface CreativeListItem extends CreativeDetail {}
