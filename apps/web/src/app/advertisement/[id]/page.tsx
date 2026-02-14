"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { ChannelModel } from "shared"
import { toast } from "sonner"
import { H3, H4, P } from "@/components/customized/typography"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { applyToAdRequest, getAdRequest, getAdRequestApplications } from "@/lib/http"
import { setBackButton } from "@/lib/tma"

interface AdRequestDetail {
	id: number
	title: string
	description: string | null
	budget: number
	minSubscribers: number
	language: string | null
	deadline: string | null
	adFormat: string
	contentGuidelines: string | null
	status: string
	isAdvertiser?: boolean
	hasApplied?: boolean
}

interface Application {
	id: number
	channelId: number
	status: string
	appliedAt: string
	channel: {
		title: string | null
		subCount: number
		avgPostReach: number
	}
}

export default function AdRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const router = useRouter()
	const [loading, setLoading] = useState(true)
	const [adRequest, setAdRequest] = useState<AdRequestDetail | null>(null)
	const [applications, setApplications] = useState<Application[]>([])
	const [applying, setApplying] = useState(false)
	const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

	useEffect(() => {
		params.then((p) => setResolvedParams(p))
	}, [params])

	useEffect(() => {
		if (resolvedParams) {
			setBackButton(() => router.back())
		}
	}, [resolvedParams, router])

	const loadData = async () => {
		if (!resolvedParams) {
			return
		}

		setLoading(true)
		const res = await getAdRequest(Number.parseInt(resolvedParams.id, 10))
		setLoading(false)

		if (res.ok) {
			setAdRequest(res.data as AdRequestDetail)
			const detail = res.data as AdRequestDetail
			if (detail.isAdvertiser) {
				const appsRes = await getAdRequestApplications(Number.parseInt(resolvedParams.id, 10))
				if (appsRes.ok) {
					setApplications(appsRes.data as Application[])
				}
			}
		} else {
			toast.error("Failed to load")
			router.back()
		}
	}

	useEffect(() => {
		if (resolvedParams) {
			loadData()
		}
	}, [resolvedParams])

	const handleApply = async () => {
		if (!adRequest) {
			return
		}
		setApplying(true)

		const { request } = await import("@/lib/http")
		const channelsRes = await request<ChannelModel[]>("channels/get-channels")

		if (!channelsRes.ok || channelsRes.data.length === 0) {
			toast.error("Add a channel first")
			setApplying(false)
			return
		}

		const channels = channelsRes.data as Array<{ id: number }>
		const res = await applyToAdRequest(adRequest.id, channels[0].id)
		setApplying(false)

		if (res.ok) {
			toast.success("Applied!")
			loadData()
		} else {
			toast.error(res.message || "Failed")
		}
	}

	const formatBudget = (b: number) => `${b.toLocaleString()} TON`

	const formatDate = (d: string | null) =>
		d
			? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
			: "No deadline"

	const getStatusBadge = (s: string) => {
		const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
			open: "default",
			in_progress: "secondary",
			completed: "outline",
			cancelled: "destructive",
		}
		return <Badge variant={variants[s] || "default"}>{s}</Badge>
	}

	if (loading) {
		return (
			<main className="flex min-h-screen w-full items-center justify-center">
				<Spinner />
			</main>
		)
	}

	if (!adRequest) {
		return (
			<main className="flex min-h-screen w-full items-center justify-center">
				<H4>Not Found</H4>
			</main>
		)
	}

	return (
		<main className="flex min-h-screen w-full flex-col gap-3 overflow-y-auto px-4 py-2">
			<H3>{adRequest.title}</H3>

			<div className="flex gap-2">
				{getStatusBadge(adRequest.status)}
				<Badge variant="outline">{adRequest.adFormat}</Badge>
			</div>

			{adRequest.description && (
				<div className="rounded-lg bg-muted/30 p-3">
					<H4 className="mb-1 text-xs">Description</H4>
					<P className="text-muted-foreground text-sm">{adRequest.description}</P>
				</div>
			)}

			<Separator />

			<div className="grid grid-cols-2 gap-3 text-sm">
				<div>
					<span className="text-muted-foreground">Budget</span>
					<P className="font-bold text-lg text-primary">{formatBudget(adRequest.budget)}</P>
				</div>
				<div>
					<span className="text-muted-foreground">Deadline</span>
					<P>{formatDate(adRequest.deadline)}</P>
				</div>
			</div>

			{(adRequest.minSubscribers > 0 || adRequest.language) && <Separator />}

			<div className="flex flex-wrap gap-2 text-sm">
				{adRequest.minSubscribers > 0 && (
					<Badge variant="outline">Min {adRequest.minSubscribers.toLocaleString()} subs</Badge>
				)}
				{adRequest.language && <Badge variant="outline">{adRequest.language}</Badge>}
			</div>

			{adRequest.contentGuidelines && (
				<div className="rounded-lg bg-muted/30 p-3">
					<H4 className="mb-1 text-xs">Content Guidelines</H4>
					<P className="text-muted-foreground text-sm">{adRequest.contentGuidelines}</P>
				</div>
			)}

			{/* Apply Button */}
			{!adRequest.isAdvertiser && adRequest.status === "open" && (
				<Button
					className="w-full"
					disabled={applying || adRequest.hasApplied}
					onClick={handleApply}
				>
					{applying ? "Applying..." : adRequest.hasApplied ? "Applied" : "Apply with Channel"}
				</Button>
			)}

			{/* Applications List (for advertiser) */}
			{adRequest.isAdvertiser && applications.length > 0 && (
				<div className="mt-2">
					<H4 className="mb-2">Applications ({applications.length})</H4>
					<div className="flex flex-col gap-2">
						{applications.map((app) => (
							<div className="flex items-center justify-between rounded-lg border p-2" key={app.id}>
								<div className="flex flex-col">
									<span className="font-medium text-sm">{app.channel.title}</span>
									<span className="text-muted-foreground text-xs">
										{app.channel.subCount.toLocaleString()} subs •{" "}
										{app.channel.avgPostReach.toLocaleString()} views
									</span>
								</div>
								<Badge
									variant={
										app.status === "accepted"
											? "default"
											: app.status === "rejected"
												? "destructive"
												: "secondary"
									}
								>
									{app.status}
								</Badge>
							</div>
						))}
					</div>
				</div>
			)}
		</main>
	)
}
