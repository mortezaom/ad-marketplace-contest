"use client"

import type { AdRequestModel } from "shared"
import { Badge } from "./ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Separator } from "./ui/separator"

interface AdRequestCardProps {
	adRequest: AdRequestModel & { hasApplied?: boolean; isOwn?: boolean }
	onClick?: (adRequest: AdRequestModel & { isOwn?: boolean; hasApplied?: boolean }) => void
	className?: string
}

export function AdRequestCard({ adRequest, onClick, className }: AdRequestCardProps) {
	const formatBudget = (budget: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 0,
		}).format(budget)
	}

	const formatDate = (date: Date | string | null) => {
		if (!date) {
			return "No deadline"
		}
		return new Date(date).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		})
	}

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "open":
				return <Badge variant="default">Open</Badge>
			case "in_progress":
				return <Badge variant="secondary">In Progress</Badge>
			case "completed":
				return <Badge variant="outline">Completed</Badge>
			case "cancelled":
				return <Badge variant="destructive">Cancelled</Badge>
			default:
				return <Badge>{status}</Badge>
		}
	}

	const getFormatBadge = (format: string) => {
		return <Badge variant="outline">{format}</Badge>
	}

	return (
		<Card
			className={`cursor-pointer transition-colors hover:bg-muted/50 ${className}`}
			onClick={() => onClick?.(adRequest)}
		>
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between">
					<CardTitle className="line-clamp-1 text-lg">{adRequest.title}</CardTitle>
					<div className="flex flex-col items-end gap-1">
						{getStatusBadge(adRequest.status)}
						{getFormatBadge(adRequest.adFormat)}
					</div>
				</div>
			</CardHeader>
			<CardContent className="pb-3">
				{adRequest.description && (
					<p className="mb-3 line-clamp-2 text-muted-foreground text-sm">{adRequest.description}</p>
				)}
				<Separator className="my-2" />
				<div className="flex flex-wrap items-center gap-2 text-sm">
					<span className="font-semibold text-primary">{formatBudget(adRequest.budget)}</span>
					{adRequest.minSubscribers > 0 && (
						<Badge className="text-xs" variant="outline">
							Min {adRequest.minSubscribers.toLocaleString()} subs
						</Badge>
					)}
					{adRequest.language && (
						<Badge className="text-xs" variant="outline">
							{adRequest.language}
						</Badge>
					)}
					<span className="ml-auto text-muted-foreground text-xs">
						Deadline: {formatDate(adRequest.deadline)}
					</span>
				</div>
				{"hasApplied" in adRequest && adRequest.hasApplied && (
					<div className="mt-2">
						<Badge className="text-xs" variant="secondary">
							Applied
						</Badge>
					</div>
				)}
			</CardContent>
		</Card>
	)
}

interface AdRequestCardSkeletonProps {
	className?: string
}

export function AdRequestCardSkeleton({ className }: AdRequestCardSkeletonProps) {
	return (
		<Card className={className}>
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between">
					<div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
					<div className="h-5 w-16 animate-pulse rounded bg-muted" />
				</div>
			</CardHeader>
			<CardContent className="pb-3">
				<div className="mb-3 h-4 w-full animate-pulse rounded bg-muted" />
				<div className="flex gap-2">
					<div className="h-4 w-20 animate-pulse rounded bg-muted" />
					<div className="h-4 w-24 animate-pulse rounded bg-muted" />
				</div>
			</CardContent>
		</Card>
	)
}
