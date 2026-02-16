"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { CreativeForm } from "@/components/creative-form"
import { H4, P } from "@/components/customized/typography"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { request } from "@/lib/http"
import { setBackButton } from "@/lib/tma"
import type { DealDetail } from "@/types/deals"

interface CreativeEditorProps {
	params: Promise<{ id: string }>
}

export default function CreativeEditorPage({ params }: CreativeEditorProps) {
	const router = useRouter()
	const [loading, setLoading] = useState(true)
	const [deal, setDeal] = useState<DealDetail | null>(null)
	const [resolvedId, setResolvedId] = useState<string | null>(null)

	useEffect(() => {
		params.then((p) => setResolvedId(p.id))
	}, [params])

	useEffect(() => {
		if (resolvedId) {
			setBackButton(() => router.back())
		}
	}, [resolvedId, router])

	useEffect(() => {
		if (!resolvedId) {
			return
		}

		loadData()
	}, [resolvedId, router])

	const isApproved = deal?.creative?.status !== "approved"

	const loadData = async () => {
		setLoading(true)
		const res = await request<DealDetail>(`deals/${resolvedId}`)
		setLoading(false)

		if (res.ok) {
			setDeal(res.data)
		} else {
			toast.error("Failed to load deal")
			router.back()
		}
	}

	if (loading) {
		return (
			<main className="flex min-h-screen w-full items-center justify-center">
				<Spinner />
			</main>
		)
	}

	if (!deal) {
		return (
			<main className="flex min-h-screen w-full items-center justify-center">
				<H4>Deal Not Found</H4>
			</main>
		)
	}

	if (deal.userRole !== "channel_owner" && isApproved) {
		return (
			<main className="flex min-h-screen w-full items-center justify-center">
				<H4>Only channel owners can edit creatives</H4>
			</main>
		)
	}

	return (
		<main className="flex min-h-screen w-full flex-col gap-4 overflow-y-auto px-4 py-2">
			<H4>{deal.creative ? 'View' : 'Create'} Draft</H4>

			<div className="rounded-lg bg-muted/30 p-3">
				<div className="flex items-center justify-between">
					<span className="font-medium">{deal.adRequest.title}</span>
					<Badge className="capitalize" variant="outline">
						{deal.adFormat}
					</Badge>
				</div>
				<P className="mt-1 text-muted-foreground text-sm">
					<span>Draft for: </span>
					<span className="font-semibold">{deal.channel.title} </span>
				</P>
			</div>

			{deal.adRequest.contentGuidelines && (
				<div className="rounded-lg bg-muted/30 p-3">
					<H4 className="mb-1 text-xs">Content Guidelines from Advertiser</H4>
					<P className="text-muted-foreground text-sm">{deal.adRequest.contentGuidelines}</P>
				</div>
			)}
					<Separator />
					<CreativeForm
						creative={deal.creative}
						dealId={deal.id}
						initialContent={deal.creative?.content || ""}
					/>
			
		</main>
	)
}
