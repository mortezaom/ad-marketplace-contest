"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { H4, P } from "@/components/customized/typography"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { request } from "@/lib/http"
import type { DealListItem } from "@/types/deals"

const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
	awaiting_creative: "outline",
	creative_submitted: "secondary",
	awaiting_payment: "secondary",
	scheduled: "default",
	posted: "default",
	completed: "outline",
	cancelled: "destructive",
}

const formatStatus = (status: string) => {
	return status.replace(/_/g, " ")
}

export function DealsList() {
	const router = useRouter()
	const [loading, setLoading] = useState(true)
	const [deals, setDeals] = useState<DealListItem[]>([])

	const loadDeals = async () => {
		setLoading(true)
		const res = await request<DealListItem[]>("deals")

		setLoading(false)

		if (res.ok) {
			setDeals(res.data)
		} else {
			toast.error("Failed to load deals")
			setDeals([])
		}
	}

	useEffect(() => {
		loadDeals()
	}, [])

	const handleDealClick = (dealId: number) => {
		router.push(`/deals/${dealId}`)
	}

	if (loading) {
		return (
			<div className="flex flex-col gap-2">
				{[1, 2, 3].map((i) => (
					<div className="rounded-lg border p-4" key={i}>
						<Skeleton className="h-5 w-3/4" />
						<Skeleton className="mt-2 h-4 w-1/2" />
					</div>
				))}
			</div>
		)
	}

	if (deals.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<H4>No Deals Yet</H4>
				<P className="text-muted-foreground text-sm">
					Your deals will appear here once you accept an application or get accepted to an ad
					request.
				</P>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-2">
			{deals.map((deal) => (
				<button
					className="flex flex-col items-start rounded-lg border p-4 text-start transition-colors hover:bg-muted/50"
					key={deal.id}
					onClick={() => handleDealClick(deal.id)}
					type="button"
				>
					<div className="flex w-full items-center justify-between">
						<span className="font-medium">{deal.adRequest.title}</span>
						<Badge variant={statusVariants[deal.status] || "outline"}>
							{formatStatus(deal.status)}
						</Badge>
					</div>
					<div className="mt-2 flex items-center gap-4 text-muted-foreground text-sm">
						<span>{deal.channel.title || "Unknown Channel"}</span>
						<span>•</span>
						<span>{deal.agreedPrice.toLocaleString()} TON</span>
					</div>
					<div className="mt-2 flex items-center gap-2 text-muted-foreground text-xs">
						<Badge className="text-xs capitalize" variant="outline">
							{deal.adFormat}
						</Badge>
						<Badge className="text-xs capitalize" variant="secondary">
							{deal.userRole === "advertiser" ? "You are advertiser" : "You are channel owner"}
						</Badge>
					</div>
				</button>
			))}
		</div>
	)
}
