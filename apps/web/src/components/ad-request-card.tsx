"use client"

import { Calendar, Globe, Users } from "lucide-react"
import type { AdRequestModel } from "shared"
import { Badge } from "./ui/badge"

interface AdRequestCardProps {
	adRequest: AdRequestModel & { hasApplied?: boolean; isOwn?: boolean }
	onClick?: (adRequest: AdRequestModel & { isOwn?: boolean; hasApplied?: boolean }) => void
	className?: string
}

export function AdRequestCard({ adRequest, onClick, className }: AdRequestCardProps) {
	const formatBudget = (budget: number) => `${budget.toLocaleString()} TON`

	const formatPublishTime = (date: Date | string | null) => {
		if (!date) {
			return null
		}
		const d = new Date(date)
		const now = new Date()
		const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
		if (diffDays < 0) {
			return "Overdue"
		}
		if (diffDays === 0) {
			return "for Today"
		}
		if (diffDays === 1) {
			return "for Tomorrow"
		}
		if (diffDays <= 7) {
			return `in ${diffDays} days`
		}
		return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
	}

	const getStatusConfig = (status: string) => {
		switch (status) {
			case "open":
				return { label: "Open", variant: "default" as const }
			case "in_progress":
				return { label: "Active", variant: "secondary" as const }
			case "completed":
				return { label: "Done", variant: "outline" as const }
			case "cancelled":
				return { label: "Cancelled", variant: "destructive" as const }
			default:
				return { label: status, variant: "outline" as const }
		}
	}

	const statusConfig = getStatusConfig(adRequest.status)

	return (
		<div
			className={`group flex cursor-pointer flex-col gap-2 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50 ${className}`}
			onClick={() => onClick?.(adRequest)}
		>
			<div className="flex items-center justify-between gap-2">
				<Badge className="h-5 shrink-0 px-1.5 py-0 text-[10px] capitalize" variant="default">
					{adRequest.adFormat}
				</Badge>
				<div className="flex min-w-0 items-center gap-1.5">
					<span className="whitespace-nowrap font-bold text-primary text-sm">
						{formatBudget(adRequest.budget)}
					</span>
					{adRequest.hasApplied && (
						<Badge
							className="h-5 shrink-0 bg-amber-100 px-1.5 py-0 text-[10px] text-amber-800"
							variant="secondary"
						>
							Applied
						</Badge>
					)}
					{adRequest.isOwn && (
						<Badge
							className="h-5 shrink-0 bg-amber-100 px-1.5 py-0 text-[10px] text-amber-800"
							variant="secondary"
						>
							Owner
						</Badge>
					)}
				</div>
			</div>

			<h3 className="min-w-0 flex-1 truncate font-medium text-sm">{adRequest.title}</h3>

			<div className="flex items-center gap-3 text-muted-foreground text-xs">
				{adRequest.minSubscribers > 0 && (
					<>
						<div className="flex items-center gap-1">
							<Users className="h-3 w-3" />
							{adRequest.minSubscribers >= 1000
								? `${(adRequest.minSubscribers / 1000).toFixed(0)}K`
								: adRequest.minSubscribers}
						</div>
						•
					</>
				)}
				{adRequest.language && (
					<>
						<div className="flex items-center gap-1">
							<Globe className="h-3 w-3" />
							{adRequest.language}
						</div>
						•
					</>
				)}

				<div className="flex items-center gap-1">
					<Badge className="h-5 px-1.5 py-0 text-[10px]" variant={statusConfig.variant}>
						{statusConfig.label}
					</Badge>
				</div>
				{adRequest.deadline && (
					<div className="ml-auto flex items-center gap-1">
						<Calendar className="h-3 w-3" />
						{formatPublishTime(adRequest.deadline)}
					</div>
				)}
			</div>
		</div>
	)
}

interface AdRequestCardSkeletonProps {
	className?: string
}

export function AdRequestCardSkeleton({ className }: AdRequestCardSkeletonProps) {
	return (
		<div className={`flex flex-col gap-2 rounded-lg border bg-card p-3 ${className}`}>
			<div className="flex items-center justify-between gap-2">
				<div className="h-5 w-12 animate-pulse rounded bg-muted" />
				<div className="flex items-center gap-1.5">
					<div className="h-4 w-14 animate-pulse rounded bg-muted" />
					<div className="h-5 w-14 animate-pulse rounded bg-muted" />
				</div>
			</div>
			<div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
			<div className="flex items-center gap-3 text-muted-foreground text-xs">
				<div className="h-3 w-10 animate-pulse rounded bg-muted" />
				<div className="h-3 w-1 animate-pulse rounded bg-muted" />
				<div className="h-3 w-8 animate-pulse rounded bg-muted" />
				<div className="h-3 w-1 animate-pulse rounded bg-muted" />
				<div className="h-5 w-10 animate-pulse rounded bg-muted" />
				<div className="ml-auto h-3 w-12 animate-pulse rounded bg-muted" />
			</div>
		</div>
	)
}
