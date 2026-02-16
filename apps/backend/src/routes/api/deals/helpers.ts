import { toNano } from "@ton/ton"
import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import {
	adApplicationsTable,
	adRequestsTable,
	channelsTable,
	dealCreativesTable,
	dealsTable,
	escrowWalletsTable,
	paymentsTable,
	tgSessions,
} from "@/db/schema"
import { addScheduledPost } from "@/queue"
import { makeClient } from "@/utils/tg-helpers"
import { checkReceived, releaseFundsToOwner } from "@/utils/ton"

export const checkBlockchainConfirmation = async (paymentId: number) => {
	const [payment] = await db
		.select({
			toAddress: paymentsTable.toAddress,
			fromAddress: paymentsTable.fromAddress,
			amountInTon: paymentsTable.amountInTon,
		})
		.from(paymentsTable)
		.where(eq(paymentsTable.id, paymentId))
		.limit(1)

	if (!(payment?.toAddress && payment.fromAddress)) {
		return { received: false, hash: null }
	}

	return checkReceived(payment.toAddress, payment.fromAddress, toNano(payment.amountInTon))
}

export const updatePaymentStatus = async (dealId: number, paymentId: number, hash: string) => {
	const now = new Date()

	const [, [updatedDeal]] = await Promise.all([
		db
			.update(paymentsTable)
			.set({
				confirmedAt: now,
				txHash: hash,
				status: "confirmed",
			})
			.where(eq(paymentsTable.id, paymentId)),
		db
			.update(dealsTable)
			.set({ updatedAt: now, status: "scheduled" })
			.where(eq(dealsTable.id, dealId))
			.returning(),
	])

	await addScheduledPost(dealId, updatedDeal.scheduledPostAt)
}

export const publishPost = async (dealId: number) => {
	const [row] = await db
		.select({
			deal: dealsTable,
			channel: channelsTable,
			draft: dealCreativesTable,
		})
		.from(dealsTable)
		.innerJoin(channelsTable, eq(channelsTable.id, dealsTable.channelId))
		.innerJoin(
			dealCreativesTable,
			and(eq(dealCreativesTable.dealId, dealsTable.id), eq(dealCreativesTable.status, "approved"))
		)
		.where(eq(dealsTable.id, dealId))
		.limit(1)

	if (!row) {
		return { success: false, postId: null }
	}

	const [session] = await db
		.select({ storageKey: tgSessions.storageKey })
		.from(tgSessions)
		.where(eq(tgSessions.status, "active"))
		.limit(1)

	if (!session) {
		return { success: false, postId: null }
	}
	try {
		const tg = await makeClient(session.storageKey)

		await tg.connect()
		const message = await tg.sendText(Number(row.channel.tgId), row.draft.content)

		await tg.disconnect()

		return message ? { success: true, postId: message.id } : { success: false, postId: null }
	} catch (error) {
		console.log(error)
		return { success: false, postId: null }
	}
}

export const updateStatusAsPosted = (dealId: number, postId: number) =>
	db
		.update(dealsTable)
		.set({
			updatedAt: new Date(),
			status: "posted",
			tgPostId: postId,
		})
		.where(eq(dealsTable.id, dealId))

export const verifyPostAliveness = async (dealId: number, postId: number) => {
	const [row] = await db
		.select({ tgId: channelsTable.tgId })
		.from(dealsTable)
		.innerJoin(channelsTable, eq(channelsTable.id, dealsTable.channelId))
		.where(eq(dealsTable.id, dealId))
		.limit(1)

	if (!row) {
		return false
	}

	const [session] = await db
		.select({ storageKey: tgSessions.storageKey })
		.from(tgSessions)
		.where(eq(tgSessions.status, "active"))
		.limit(1)

	if (!session) {
		return false
	}
	try {
		const tg = await makeClient(session.storageKey)

		await tg.connect()
		const [message] = await tg.getMessages(Number(row.tgId), [postId])

		await tg.disconnect()

		return !!message
	} catch (error) {
		console.error(error)
		return false
	}
}

const settleDeal = async (dealId: number, outcome: "completed" | "cancelled") => {
	const now = new Date()
	const isCompleted = outcome === "completed"

	const [deal] = await db
		.update(dealsTable)
		.set({
			updatedAt: now,
			status: outcome,
			...(isCompleted ? { completedAt: now } : { cancelledAt: now }),
		})
		.where(eq(dealsTable.id, dealId))
		.returning()

	if (!deal) {
		return
	}

	const [row] = await db
		.select({
			adRequestId: adApplicationsTable.adRequestId,
			walletAddress: channelsTable.walletAddress,
			paymentFromAddress: paymentsTable.fromAddress,
			escrowPrivateKey: escrowWalletsTable.privateKey,
			escrowPublicKey: escrowWalletsTable.publicKey,
		})
		.from(adApplicationsTable)
		.innerJoin(adRequestsTable, eq(adRequestsTable.id, adApplicationsTable.adRequestId))
		.innerJoin(channelsTable, eq(channelsTable.id, adApplicationsTable.channelId))
		.innerJoin(paymentsTable, eq(paymentsTable.dealId, dealId))
		.innerJoin(escrowWalletsTable, eq(escrowWalletsTable.id, paymentsTable.escrowWallet))
		.where(eq(adApplicationsTable.id, deal.applicationId))
		.limit(1)

	if (!row) {
		return
	}

	await db
		.update(adRequestsTable)
		.set({ updatedAt: now, status: outcome })
		.where(eq(adRequestsTable.id, row.adRequestId))

	const recipient = isCompleted ? (row.walletAddress ?? "") : (row.paymentFromAddress ?? "")

	await releaseFundsToOwner(row.escrowPrivateKey, row.escrowPublicKey, recipient, deal.agreedPrice)
}

export const onPostAlivenessVerified = (dealId: number) => settleDeal(dealId, "completed")

export const onPostAlivenessFailed = (dealId: number) => settleDeal(dealId, "cancelled")
