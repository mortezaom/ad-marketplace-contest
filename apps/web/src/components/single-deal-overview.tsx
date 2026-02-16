"use client"

import { openTelegramLink } from "@telegram-apps/sdk-react"
import { LinkIcon } from "lucide-react"
import { H3, H4, P } from "@/components/customized/typography"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { DealDetail } from "@/types/deals"

type BadgeVariant = "default" | "secondary" | "outline" | "destructive"

const statusVariants: Record<string, BadgeVariant> = {
	awaiting_creative: "outline",
	creative_submitted: "secondary",
	awaiting_payment: "secondary",
	scheduled: "default",
	posted: "default",
	completed: "outline",
	cancelled: "destructive",
}

const formatStatus = (status: string) => status.replace(/_/g, " ")

const formatDate = (date: string | null) =>
	date
		? new Date(date).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			})
		: "Not scheduled"

interface DealOverviewProps {
	deal: DealDetail
	isAdvertiser: boolean
}

export function DealOverview({ deal, isAdvertiser }: DealOverviewProps) {
	return (
		<>
			{/* Header */}
			<div className="flex items-start justify-between">
				<div>
					<H3>{deal.adRequest.title}</H3>
					<P className="text-muted-foreground text-sm">
						Created {new Date(deal.createdAt).toLocaleDateString()}
					</P>
				</div>
				<Badge variant={statusVariants[deal.status] || "outline"}>
					{formatStatus(deal.status)}
				</Badge>
			</div>

			<Separator />

			{/* Channel Info */}
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

			<Separator />

			{/* Deal Details Grid */}
			<div className="grid grid-cols-2 gap-4">
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
				<div>
					<span className="text-muted-foreground text-sm">Your Role</span>
					<Badge className="capitalize" variant={isAdvertiser ? "default" : "secondary"}>
						{isAdvertiser ? "Advertiser" : "Channel Owner"}
					</Badge>
				</div>
			</div>

			{/* Ad Request Details */}
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

			{/* Advertiser Info (channel owners only) */}
			{!isAdvertiser && (
				<>
					<Separator />
					<div className="flex flex-col gap-2">
						<H4>Advertiser</H4>
						<div className="flex items-center gap-3 rounded-lg border p-3">
							<Avatar className="h-10 w-10">
								<AvatarImage src={deal.advertiser.photo_url || undefined} />
								<AvatarFallback>{deal.advertiser.firstName.charAt(0).toUpperCase()}</AvatarFallback>
							</Avatar>
							<div className="flex flex-col">
								<span className="font-medium">
									{deal.advertiser.firstName} {deal.advertiser.lastName || ""}
								</span>
								{deal.advertiser.username && (
									<span className="text-muted-foreground text-xs">@{deal.advertiser.username}</span>
								)}
							</div>
						</div>
					</div>
				</>
			)}
		</>
	)
}
