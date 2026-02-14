"use client"

import { mainButton } from "@telegram-apps/sdk-react"
import { FilterIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { AdRequestModel } from "shared"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { getAdRequests } from "@/lib/http"
import { H4, P } from "./customized/typography"
import { Badge } from "./ui/badge"

interface AdRequestWithFlags extends AdRequestModel {
	isOwn?: boolean
	hasApplied?: boolean
}

interface AdsResponse {
	requests: AdRequestWithFlags[]
	filters: {
		hasChannels: boolean
		total: number
	}
}

export function AdList() {
	const router = useRouter()
	const [loading, setLoading] = useState(true)
	const [adRequests, setAdRequests] = useState<AdRequestWithFlags[]>([])
	const [statusFilter, setStatusFilter] = useState("")
	const [minBudget, setMinBudget] = useState("")
	const [maxBudget, setMaxBudget] = useState("")
	const [languageFilter, setLanguageFilter] = useState("")

	const loadAdRequests = async () => {
		setLoading(true)
		const res = await getAdRequests({
			status:
				statusFilter === "none"
					? undefined
					: (statusFilter as "open" | "in_progress" | "completed" | "cancelled" | undefined),
			minBudget: minBudget ? Number.parseInt(minBudget, 10) : undefined,
			maxBudget: maxBudget ? Number.parseInt(maxBudget, 10) : undefined,
			language: languageFilter || undefined,
		})
		setLoading(false)

		if (res.ok) {
			setAdRequests((res.data as AdsResponse).requests)
		} else {
			toast.error("Failed to load")
			setAdRequests([])
		}
	}

	useEffect(() => {
		loadAdRequests()
	}, [])

	const handleApplyFilters = () => {
		loadAdRequests()
	}

	const formatBudget = (b: number) => `${b.toLocaleString()} TON`

	const formatDate = (d: Date | string | null) =>
		d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""

	const onFilterSheetChange = (open: boolean) => {
		mainButton.setParams({
			isVisible: !open,
		})
	}

	const getStatusBadge = (s: string) => {
		const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
			open: "default",
			in_progress: "secondary",
			completed: "outline",
			cancelled: "destructive",
		}
		return (
			<Badge className="text-xs" variant={variants[s] || "default"}>
				{s}
			</Badge>
		)
	}

	return (
		<div className="flex w-full flex-col gap-2">
			<Sheet onOpenChange={onFilterSheetChange}>
				<SheetTrigger asChild>
					<Button className="gap-2" size="sm" variant="outline">
						<FilterIcon className="h-4 w-4" />
						Filters {adRequests.length > 0 && `(${adRequests.length})`}
					</Button>
				</SheetTrigger>
				<SheetContent className="h-auto max-h-[70vh]" side="bottom">
					<SheetHeader>
						<SheetTitle>Filter Ads</SheetTitle>
					</SheetHeader>
					<div className="flex flex-col gap-3 p-4">
						<div className="flex gap-2">
							<Input
								className="h-10"
								onChange={(e) => setMinBudget(e.target.value)}
								placeholder="Min budget"
								type="number"
								value={minBudget}
							/>
							<Input
								className="h-10"
								onChange={(e) => setMaxBudget(e.target.value)}
								placeholder="Max budget"
								type="number"
								value={maxBudget}
							/>
						</div>

						<Input
							className="h-10"
							onChange={(e) => setLanguageFilter(e.target.value)}
							placeholder="Language (e.g., English)"
							value={languageFilter}
						/>

						<Select onValueChange={setStatusFilter} value={statusFilter}>
							<SelectTrigger className="h-10">
								<SelectValue placeholder="All Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={"none"}>All Status</SelectItem>
								<SelectItem value="open">Open</SelectItem>
								<SelectItem value="in_progress">In Progress</SelectItem>
								<SelectItem value="completed">Completed</SelectItem>
								<SelectItem value="cancelled">Cancelled</SelectItem>
							</SelectContent>
						</Select>

						<Button className="w-full" onClick={handleApplyFilters}>
							Apply Filters
						</Button>
					</div>
				</SheetContent>
			</Sheet>

			{loading && <div className="py-4 text-center text-muted-foreground">Loading...</div>}

			{!loading && adRequests.length === 0 && (
				<div className="py-24 text-center">
					<H4>No Advertisements Yet.</H4>

					<P className="text-muted-foreground text-sm">
						Add your first advertisement by clicking the button below.
					</P>
				</div>
			)}

			{!loading && adRequests.length > 0 && (
				<div className="flex flex-col gap-1">
					{adRequests.map((ad) => (
						<div
							className="flex cursor-pointer items-center justify-between rounded-md bg-muted/30 p-2 transition-colors hover:bg-muted/50"
							key={ad.id}
							onClick={() => router.push(`/advertisement/${ad.id}`)}
						>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-1">
									{ad.isOwn && (
										<Badge className="px-1 text-[10px]" variant="default">
											Your
										</Badge>
									)}
									{ad.hasApplied && !ad.isOwn && (
										<Badge className="px-1 text-[10px]" variant="secondary">
											Applied
										</Badge>
									)}
									<span className="truncate font-medium text-sm">{ad.title}</span>
								</div>
								<div className="mt-0.5 flex items-center gap-1 text-muted-foreground text-xs">
									<span className="font-semibold text-primary">{formatBudget(ad.budget)}</span>
									{ad.language && <span>• {ad.language}</span>}
									{formatDate(ad.deadline) && <span>• {formatDate(ad.deadline)}</span>}
								</div>
							</div>
							<div className="ml-2 shrink-0">{getStatusBadge(ad.status)}</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
