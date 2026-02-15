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
import { request } from "@/lib/http"
import { convertAdsFilter } from "@/lib/utils"
import { AdRequestCard, AdRequestCardSkeleton } from "./ad-request-card"
import { H4, P } from "./customized/typography"

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

	const [sheetOpen, setSheetOpen] = useState(false)

	const loadAdRequests = async () => {
		setLoading(true)
		const query = convertAdsFilter({
			status:
				statusFilter === "none"
					? undefined
					: (statusFilter as "open" | "in_progress" | "completed" | "cancelled" | undefined),
			minBudget: minBudget ? Number.parseInt(minBudget, 10) : undefined,
			maxBudget: maxBudget ? Number.parseInt(maxBudget, 10) : undefined,
			language: languageFilter || undefined,
		})

		const res = await request<AdsResponse>(`ads${query}`)

		setLoading(false)

		if (res.ok) {
			setAdRequests(res.data.requests)
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
		onFilterSheetChange(false)
	}

	const onFilterSheetChange = (open: boolean) => {
		setSheetOpen(open)
		mainButton.setParams({
			isVisible: !open,
		})
	}

	return (
		<div className="flex w-full flex-col gap-2">
			<Sheet onOpenChange={onFilterSheetChange} open={sheetOpen}>
				<SheetTrigger asChild>
					<Button className="ml-auto gap-2" size="icon" variant="outline">
						<FilterIcon className="h-4 w-4" />
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

			{loading && (
				<div className="py-4 text-center text-muted-foreground">
					<AdRequestCardSkeleton />
				</div>
			)}

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
						<AdRequestCard
							adRequest={ad}
							key={ad.id}
							onClick={() => router.push(`/advertisement/${ad.id}`)}
						/>
					))}
				</div>
			)}
		</div>
	)
}
