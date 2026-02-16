// queue-workers.ts
import { Worker } from "bunqueue/client"
import {
	checkBlockchainConfirmation,
	onPostAlivenessFailed,
	onPostAlivenessVerified,
	publishPost,
	updatePaymentStatus,
	updateStatusAsPosted,
	verifyPostAliveness,
} from "@/routes/api/deals/helpers"
import type {
	PaymentConfirmationJob,
	PaymentConfirmationResult,
	PostAlivenessJob,
	PostAlivenessResult,
	ScheduledPostingJob,
	ScheduledPostingResult,
} from "./index"
import { addPostAlivenessCheck } from "./index"

export const paymentConfirmationWorker = new Worker<
	PaymentConfirmationJob,
	PaymentConfirmationResult
>(
	"payment-confirmation",
	async (job) => {
		const { dealId, paymentId } = job.data

		const { received, hash } = await checkBlockchainConfirmation(paymentId)

		if (!(received && hash)) {
			throw new Error("Transaction not confirmed yet")
		}

		await updatePaymentStatus(dealId, paymentId, hash)
		return { confirmed: true, timestamp: Date.now() }
	},
	{ embedded: true, concurrency: 5 }
)

export const scheduledPostingWorker = new Worker<ScheduledPostingJob, ScheduledPostingResult>(
	"scheduled-posting",
	async (job) => {
		const { dealId } = job.data

		const result = await publishPost(dealId)

		if (!result.success) {
			throw new Error("Failed to publish post")
		}

		if (!result.postId) {
			throw new Error("Post published but no postId returned")
		}

		await updateStatusAsPosted(dealId, result.postId)
		await addPostAlivenessCheck(dealId, result.postId)

		return { published: true, publishedAt: Date.now() }
	},
	{ embedded: true, concurrency: 3 }
)

export const postAlivenessWorker = new Worker<PostAlivenessJob, PostAlivenessResult>(
	"post-aliveness",
	async (job) => {
		const { dealId, postId } = job.data

		const isAlive = await verifyPostAliveness(dealId, postId)

		if (!isAlive) {
			await onPostAlivenessFailed(dealId)
			return { isAlive: false, status: "failed" }
		}

		await onPostAlivenessVerified(dealId)
		return { isAlive: true, status: "alive" }
	},
	{ embedded: true, concurrency: 2 }
)
