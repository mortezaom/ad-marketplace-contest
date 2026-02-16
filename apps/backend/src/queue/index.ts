import { Queue } from "bunqueue/client"

export const QUEUE_CONFIG = {
	BLOCKCHAIN_CHECK_INTERVAL: 60_000,
	BLOCKCHAIN_MAX_ATTEMPTS: 1440,
	POST_ALIVENESS_CHECK_DELAY: 86_400_000,
} as const

// Types
export interface PaymentConfirmationJob {
	dealId: number
	paymentId: number
}

export interface PaymentConfirmationResult {
	confirmed: boolean
	blockNumber?: number
	timestamp?: number
}

export interface ScheduledPostingJob {
	dealId: number
}

export interface ScheduledPostingResult {
	published: boolean
	publishedAt?: number
}

export interface PostAlivenessJob {
	postId: number
	dealId: number
}

export interface PostAlivenessResult {
	isAlive: boolean
	status?: string
}

// Queues
export const paymentConfirmationQueue = new Queue<PaymentConfirmationJob>("payment-confirmation", {
	embedded: true,
})

export const scheduledPostingQueue = new Queue<ScheduledPostingJob>("scheduled-posting", {
	embedded: true,
})

export const postAlivenessQueue = new Queue<PostAlivenessJob>("post-aliveness", { embedded: true })

export function addPaymentConfirmation(dealId: number, paymentId: number) {
	return paymentConfirmationQueue.add(
		"verify",
		{ dealId, paymentId },
		{
			attempts: QUEUE_CONFIG.BLOCKCHAIN_MAX_ATTEMPTS,
			backoff: {
				type: "fixed",
				delay: QUEUE_CONFIG.BLOCKCHAIN_CHECK_INTERVAL,
			},
		}
	)
}

export function addScheduledPost(dealId: number, publishDate: Date) {
	const delayMs = publishDate.getTime() - Date.now()

	if (delayMs <= 0) {
		throw new Error("Publish date must be in the future")
	}

	return scheduledPostingQueue.add("publish", { dealId }, { delay: delayMs })
}

export function addPostAlivenessCheck(dealId: number, postId: number) {
	return postAlivenessQueue.add(
		"check",
		{ postId, dealId },
		{ delay: QUEUE_CONFIG.POST_ALIVENESS_CHECK_DELAY }
	)
}
