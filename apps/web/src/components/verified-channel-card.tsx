import { Coins, ExternalLink, Tag, TrendingUp, Users } from "lucide-react"
import type { ChannelModel } from "shared"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getChannelPhoto } from "@/lib/http"
import { cn } from "@/lib/utils"
import { Skeleton } from "./ui/skeleton"

interface VChannelDetailCardProps {
	channel: ChannelModel
	onClick?: (channel: ChannelModel) => void
	className?: string
}

export function VChannelDetailCard({ channel, onClick, className }: VChannelDetailCardProps) {
	const initials = (channel.title ?? "CH").slice(0, 2).toUpperCase()
	const telegramUrl = channel.tgLink.startsWith("http")
		? channel.tgLink
		: `https://t.me/${channel.tgLink}`

	const getLanguagePercentage = (langTotal: number) => {
		const total = channel.languages.reduce((acc, lang) => acc + lang.total, 0)
		return Math.round((langTotal / total) * 100)
	}

	return (
		<div
			className={cn(
				"flex w-full cursor-pointer flex-col rounded-lg border p-4",
				"transition-colors duration-200 hover:bg-muted",
				className
			)}
			onClick={() => onClick?.(channel)}
		>
			{/* Header */}
			<div className="flex items-start gap-3">
				<Avatar className="h-12 w-12 shrink-0">
					<AvatarImage src={getChannelPhoto(channel.tgLink)} />
					<AvatarFallback className="bg-primary/10 font-medium text-primary text-sm">
						{initials}
					</AvatarFallback>
				</Avatar>

				<div className="min-w-0 flex-1">
					<h3 className="truncate font-semibold text-sm">{channel.title}</h3>
					<a
						className="mt-0.5 flex items-center gap-1 text-muted-foreground text-xs hover:text-primary"
						href={telegramUrl}
						onClick={(e) => e.stopPropagation()}
						rel="noopener noreferrer"
						target="_blank"
					>
						{channel.tgLink}
						<ExternalLink className="h-3 w-3" />
					</a>
				</div>
			</div>

			{/* Stats */}
			<div className="mt-3 flex items-center gap-4 text-xs">
				<div className="flex items-center gap-1">
					<Users className="h-3.5 w-3.5 text-muted-foreground" />
					<span className="font-medium">
						{channel.subCount >= 1000
							? `${(channel.subCount / 1000).toFixed(1)}K`
							: channel.subCount}
					</span>
				</div>

				{channel.avgPostReach !== undefined && (
					<div className="flex items-center gap-1">
						<TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
						<span className="font-medium">
							{channel.avgPostReach >= 1000
								? `${(channel.avgPostReach / 1000).toFixed(1)}K`
								: channel.avgPostReach}
						</span>
					</div>
				)}

				<div className="flex items-center gap-1">
					<Tag className="h-3.5 w-3.5 text-muted-foreground" />
					<span className="font-medium">{channel.offersCount}</span>
				</div>
			</div>

			<Separator className="my-3" />

			{/* Pricing */}
			<div>
				<div className="mb-2 flex items-center gap-1 font-medium text-muted-foreground text-xs">
					<Coins className="h-3.5 w-3.5" />
					Pricing
				</div>
				<div className="flex gap-3 text-xs">
					{channel.listingInfo.postPrice > 0 && (
						<div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1">
							<span className="text-muted-foreground">Post</span>
							<span className="font-semibold">{channel.listingInfo.postPrice} TON</span>
						</div>
					)}
					{channel.listingInfo.storyPrice > 0 && (
						<div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1">
							<span className="text-muted-foreground">Story</span>
							<span className="font-semibold">{channel.listingInfo.storyPrice} TON</span>
						</div>
					)}
					{channel.listingInfo.forwardPrice > 0 && (
						<div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1">
							<span className="text-muted-foreground">Forward</span>
							<span className="font-semibold">{channel.listingInfo.forwardPrice} TON</span>
						</div>
					)}
				</div>
			</div>

			{/* Languages */}
			{channel.languages.length > 0 && (
				<>
					<Separator className="my-3" />
					<div>
						<div className="mb-2 font-medium text-muted-foreground text-xs">Languages</div>
						<div className="flex flex-wrap gap-1.5">
							{channel.languages.map((lang) => (
								<Badge className="text-[10px]" key={lang.name} variant="outline">
									{lang.name} ({getLanguagePercentage(lang.total)}%)
								</Badge>
							))}
						</div>
					</div>
				</>
			)}
		</div>
	)
}

interface VChannelDetailCardSkeletonProps {
	className?: string
}

export function VChannelDetailCardSkeleton({ className }: VChannelDetailCardSkeletonProps) {
	return (
		<div className={cn("flex w-full flex-col rounded-lg border p-4", className)}>
			<div className="flex items-start gap-3">
				<Skeleton className="h-12 w-12 rounded-full" />
				<div className="min-w-0 flex-1 space-y-2">
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-3 w-1/2" />
				</div>
			</div>

			<div className="mt-3 flex gap-4">
				<Skeleton className="h-4 w-16" />
				<Skeleton className="h-4 w-16" />
				<Skeleton className="h-4 w-12" />
			</div>

			<Separator className="my-3" />

			<div className="space-y-2">
				<Skeleton className="h-3 w-20" />
				<div className="flex gap-2">
					<Skeleton className="h-7 w-20" />
					<Skeleton className="h-7 w-20" />
					<Skeleton className="h-7 w-20" />
				</div>
			</div>

			<Separator className="my-3" />

			<div className="space-y-2">
				<Skeleton className="h-3 w-16" />
				<div className="flex gap-1.5">
					<Skeleton className="h-5 w-14" />
					<Skeleton className="h-5 w-14" />
					<Skeleton className="h-5 w-14" />
				</div>
			</div>
		</div>
	)
}
