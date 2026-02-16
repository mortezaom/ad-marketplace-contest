// components/ads/AdRequestDetailPage.tsx
"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { ChannelModel } from "shared"
import { toast } from "sonner"
import { ApplicationReviewSheet } from "@/components/application-review-sheet"
import { ChannelSelectionSheet } from "@/components/channel-selection-sheet"
import { H3, H4, P } from "@/components/customized/typography"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { request } from "@/lib/http"
import { setBackButton } from "@/lib/tma"

export interface AdRequestDetail {
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

export interface Application {
	id: number
	channelId: number
	status: string
	appliedAt: string
	channel: ChannelModel
}

export default function AdRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const router = useRouter()
	const [loading, setLoading] = useState(true)
	const [adRequest, setAdRequest] = useState<AdRequestDetail | null>(null)
	const [applications, setApplications] = useState<Application[]>([])
	const [channelOptions, setChannelOptions] = useState<ChannelModel[]>([])
	const [sheetOpen, setSheetOpen] = useState(false)
	const [sheetLoading, setSheetLoading] = useState(false)
	const [sheetError, setSheetError] = useState<string | null>(null)
	const [applying, setApplying] = useState(false)
	const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

	const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)

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
		const res = await request(`ads/${resolvedParams.id}`)
		setLoading(false)

		if (res.ok) {
			setAdRequest(res.data as AdRequestDetail)
			const detail = res.data as AdRequestDetail
			if (detail.isAdvertiser) {
				const appsRes = await request<Application[]>(`ads/${resolvedParams.id}/applications`)
				if (appsRes.ok) {
					setApplications(appsRes.data)
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

	const handleApplyClick = async () => {
		if (!adRequest) {
			return
		}

		setSheetLoading(true)
		setSheetError(null)

		const channelsRes = await request<ChannelModel[]>("channels/get-channels-for-apply", {
			searchParams: { request: adRequest.id },
		})

		setSheetLoading(false)

		if (channelsRes.ok) {
			const channels = channelsRes.data
			setChannelOptions(channels)
			setSheetError(channels.length === 0 ? "No channels available" : null)
		} else {
			setSheetError(channelsRes.message || "Failed to load channels")
			setChannelOptions([])
		}

		setSheetOpen(true)
	}

	const handleChannelSelect = async (channelId: number) => {
		if (!adRequest) {
			return
		}

		setApplying(true)

		const res = await request(`ads/${adRequest.id}/apply`, {
			method: "POST",
			json: { channelId },
		})

		setApplying(false)
		setSheetOpen(false)

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
			: "No Date"

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

			<div className="flex justify-between capitalize">
				<Badge variant="outline">{adRequest.adFormat}</Badge>
				{getStatusBadge(adRequest.status)}
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
					<span className="text-muted-foreground">Post Date</span>
					<P>{formatDate(adRequest.deadline)}</P>
				</div>
			</div>

			{(adRequest.minSubscribers > 0 || adRequest.language) && <Separator />}

			<div className="flex flex-wrap gap-2 text-sm">
				{adRequest.minSubscribers > 0 && (
					<Badge variant="outline">Min {adRequest.minSubscribers.toLocaleString()} subs</Badge>
				)}
				{adRequest.language && <Badge variant="outline">Language: {adRequest.language}</Badge>}
			</div>

			{adRequest.contentGuidelines && (
				<div className="rounded-lg bg-muted/30 p-3">
					<H4 className="mb-1 text-xs">Content Guidelines</H4>
					<P className="text-muted-foreground text-sm">{adRequest.contentGuidelines}</P>
				</div>
			)}

			{/* Apply Button for channel owners */}
			{!adRequest.isAdvertiser && adRequest.status === "open" && (
				<Button
					className="w-full"
					disabled={applying || adRequest.hasApplied}
					onClick={handleApplyClick}
				>
					{adRequest.hasApplied ? "Applied" : "Apply with Channel"}
					{applying && <Spinner data-icon="inline-start" />}
				</Button>
			)}

			{/* Applications List (for advertiser) */}
			{adRequest.isAdvertiser && applications.length > 0 && (
				<div className="mt-2">
					<H4 className="mb-2">Applications ({applications.length})</H4>
					<div className="flex flex-col gap-2">
						{applications.map((app) => (
							<button
								className="flex items-center justify-between rounded-lg border p-2"
								key={app.id}
								onClick={() => setSelectedApplication(app)}
								type="button"
							>
								<div className="flex flex-col">
									<span className="text-start font-medium text-sm">{app.channel.title}</span>
									<span className="text-muted-foreground text-xs">
										{app.channel.subCount.toLocaleString()} subs •{" "}
										{app.channel.avgPostReach?.toLocaleString() ?? "N/A"} avg views
									</span>
								</div>
								<Badge
									className="capitalize"
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
							</button>
						))}
					</div>
				</div>
			)}

			<ChannelSelectionSheet
				applying={applying}
				channels={channelOptions}
				error={sheetError}
				loading={sheetLoading}
				onOpenChange={setSheetOpen}
				onSelect={handleChannelSelect}
				open={sheetOpen}
			/>

			<ApplicationReviewSheet
				adRequest={adRequest}
				application={selectedApplication}
				onOpenChange={(open) => !open && setSelectedApplication(null)}
				onRefresh={loadData}
			/>
		</main>
	)
}
