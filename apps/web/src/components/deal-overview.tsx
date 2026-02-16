"use client"

import { openTelegramLink } from "@telegram-apps/sdk-react"
import { toNano } from "@ton/ton"
import { TonConnectButton, useTonAddress, useTonConnectUI } from "@tonconnect/ui-react"
import { LinkIcon, MessageCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { H4, H5, P } from "@/components/customized/typography"
import { FeedbackSheet } from "@/components/feedback-sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { request } from "@/lib/http"
import { formatDate, statusVariants, transformStatus } from "@/lib/utils"
import type { DealDetail } from "@/types/deals"
import { CustomConfirm } from "./customized/custom-confirm"
import { Spinner } from "./ui/spinner"

interface DealOverviewProps {
	deal: DealDetail
	isAdvertiser: boolean
}

export function DealOverview({ deal, isAdvertiser }: DealOverviewProps) {
	return (
		<>
			<DealHeader deal={deal} />
			<Separator />
			<ChannelInfo deal={deal} />
			<Separator />
			<DealDetails deal={deal} isAdvertiser={isAdvertiser} />
			<AdRequestInfo deal={deal} />
			<Separator />

			<CommunicationSection dealId={deal.id} />

			{deal.status === "awaiting_payment" && <PaymentSection deal={deal} />}
		</>
	)
}

function DealHeader({ deal }: { deal: DealDetail }) {
	return (
		<div className="flex items-start justify-between">
			<div>
				<H4>{deal.adRequest.title}</H4>
				<P className="text-muted-foreground text-sm">
					Created {new Date(deal.createdAt).toLocaleDateString()}
				</P>
			</div>
			<Badge variant={statusVariants[deal.status] || "outline"}>
				{transformStatus(deal.status)}
			</Badge>
		</div>
	)
}

function ChannelInfo({ deal }: { deal: DealDetail }) {
	return (
		<div className="flex items-center gap-3">
			<Avatar className="h-12 w-12">
				<AvatarImage src={deal.channel.tgLink} />
				<AvatarFallback>{(deal.channel.title || "C").charAt(0).toUpperCase()}</AvatarFallback>
			</Avatar>
			<div className="flex flex-col">
				<span className="font-semibold">{deal.channel.title || "Unknown Channel"}</span>
				<Button
					className="flex h-auto items-center gap-1 p-0! text-primary text-xs"
					onClick={() => openTelegramLink(deal.channel.tgLink)}
					variant="link"
				>
					<LinkIcon className="h-3! w-3!" />
					{deal.channel.tgLink}
				</Button>
			</div>
			<div className="ml-auto flex flex-col items-end text-sm">
				<span className="font-semibold">{deal.channel.subCount.toLocaleString()} subs</span>
				<span className="text-muted-foreground">
					{deal.channel.avgPostReach.toLocaleString()} avg views
				</span>
			</div>
		</div>
	)
}

function DealDetails({ deal, isAdvertiser }: { deal: DealDetail; isAdvertiser: boolean }) {
	return (
		<div className="mb-4 grid grid-cols-2 gap-4 text-sm">
			<div>
				<span className="text-muted-foreground text-sm">Format</span>
				<P className="font-semibold capitalize">{deal.adFormat}</P>
			</div>
			<div>
				<span className="text-muted-foreground text-sm">Price</span>
				<P className="font-semibold text-primary">{deal.agreedPrice.toLocaleString()} TON</P>
			</div>
			<div>
				<span className="text-muted-foreground text-sm">Scheduled</span>
				<P>{formatDate(deal.scheduledPostAt)}</P>
			</div>
			<div className="flex flex-col gap-1">
				<span className="text-muted-foreground text-sm">Role</span>
				<Badge variant="secondary">{isAdvertiser ? "Advertiser" : "Channel Owner"}</Badge>
			</div>
		</div>
	)
}

function AdRequestInfo({ deal }: { deal: DealDetail }) {
	if (!(deal.adRequest.description || deal.adRequest.contentGuidelines)) {
		return null
	}

	return (
		<>
			{deal.adRequest.description && (
				<div className="rounded-lg bg-muted/30 p-3">
					<H4 className="mb-1 text-xs">Description</H4>
					<P className="text-muted-foreground text-sm">{deal.adRequest.description}</P>
				</div>
			)}
			{deal.adRequest.contentGuidelines && (
				<div className="rounded-lg bg-muted/30 p-3">
					<H4 className="mb-1 text-xs">Content Guidelines</H4>
					<P className="text-muted-foreground text-sm">{deal.adRequest.contentGuidelines}</P>
				</div>
			)}
		</>
	)
}

function CommunicationSection({ dealId }: { dealId: number }) {
	return (
		<div className="flex flex-col gap-2">
			<H5>Communication</H5>
			<FeedbackSheet
				dealId={dealId}
				trigger={
					<Button className="w-full" variant="outline">
						<MessageCircle className="mr-2 h-4 w-4" />
						Send Feedback
					</Button>
				}
			/>
		</div>
	)
}

interface DealPaymentType {
	id: number
	status: "pending" | "confirming" | "confirmed" | "failed"
	dealId: number
	escrowWallet: number
	amountInTon: number
	fromAddress: string | null
	toAddress: string | null
}

function PaymentSection({ deal }: { deal: DealDetail }) {
	const walletAddress = useTonAddress(true)

	const [tonConnectUI] = useTonConnectUI()

	const [paymentCompleted, setPaymentCompleted] = useState<boolean>(false)
	const [loading, setLoading] = useState(false)

	const fetchWallet = async () => {
		if (!walletAddress) {
			toast.error("Wallet not connected!")
			return
		}

		const res = await request<DealPaymentType>(`deals/${deal.id}/get-payment-wallet`, {
			method: "post",
			json: {
				userWallet: walletAddress,
			},
		})

		if (res.ok) {
			return res.data.toAddress
		}
	}

	const payAmount = async () => {
		setLoading(true)
		const recipient = await fetchWallet()
		if (!recipient) {
			toast.error("failed to prepare transaction!")
			setLoading(false)
			return
		}
		const amountTon = deal.agreedPrice

		const tx = {
			validUntil: Math.floor(Date.now() / 1000) + 5 * 60, // 5 min
			messages: [
				{
					address: recipient,
					amount: toNano(amountTon).toString(),
				},
			],
		}

		try {
			await tonConnectUI.sendTransaction(tx)

			setPaymentCompleted(true)

			await request<DealPaymentType>(`deals/${deal.id}/submit-transaction`, {
				method: "post",
			})
		} catch (e) {
			// user rejected / wallet error
			console.error(e)
			toast.error("Payment failed, check your wallet/balance and try again!")
		} finally {
			setLoading(false)
		}
	}

	const loadPayment = async () => {
		const res = await request<DealPaymentType>(`deals/${deal.id}/get-payment`, {
			method: "get",
		})

		if (res.ok) {
			setPaymentCompleted(["confirming", "confirmed"].includes(res.data.status))
		}
	}

	useEffect(() => {
		loadPayment()
	}, [])

	return (
		<Card>
			{paymentCompleted ? (
				<div className="flex flex-col items-center gap-2 p-8 text-center transition-all">
					<CustomConfirm showTick={true} />
					<P className="font-medium text-muted-foreground text-sm">
						Your payment has been submitted to the network. After we receive confirmation, your
						approved draft will be scheduled to be posted on the channel.
					</P>
				</div>
			) : (
				<>
					<CardHeader>
						<CardTitle>Payment Required</CardTitle>
						<CardDescription>
							Please complete the payment to proceed with the ad posting.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-8">
						<div className="flex w-full items-center justify-between">
							<P className="font-semibold text-sm">
								{walletAddress ? "Connected" : "Not Connected"}
							</P>
							<TonConnectButton />
						</div>
						{walletAddress && !paymentCompleted && (
							<div className="flex flex-col">
								<Button disabled={loading} onClick={payAmount}>
									Pay
									{loading && <Spinner data-icon="inline-end" />}
								</Button>
							</div>
						)}
					</CardContent>
				</>
			)}
		</Card>
	)
}
