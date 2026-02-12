import type { ChannelModel } from "shared"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getChannelPhoto } from "@/lib/http"
import { cn } from "@/lib/utils"
import { Skeleton } from "./ui/skeleton"

interface ChannelCardProps {
	channel: ChannelModel
	onClick?: (channel: ChannelModel) => void
	className?: string
}

export function ChannelCard({ channel, onClick, className }: ChannelCardProps) {
	const initials = (channel.title ?? "Channel").charAt(0).toUpperCase()

	return (
		<div
			className={cn(
				"flex w-full cursor-pointer items-center gap-3 rounded-lg p-3",
				"transition-colors duration-200 hover:bg-muted",
				className
			)}
			onClick={() => onClick?.(channel)}
		>
			<Avatar className="h-12 w-12 shrink-0">
				<AvatarImage src={getChannelPhoto(channel.tgLink)} />
				<AvatarFallback className="bg-primary/10 font-medium text-primary">
					{initials}
				</AvatarFallback>
			</Avatar>

			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-1.5">
					<span className="truncate font-semibold text-sm">{channel.title}</span>
				</div>
				<p className="mt-0.5 truncate text-muted-foreground text-xs">{channel.tgLink}</p>
			</div>
		</div>
	)
}

interface ChannelCardSkeletonProps {
	className?: string
}

export function ChannelCardSkeleton({ className }: ChannelCardSkeletonProps) {
	return (
		<div className={cn("flex w-full items-center gap-3 rounded-lg p-3", className)}>
			<Skeleton className="h-12 w-12 rounded-full bg-accent-foreground/30" />

			<div className="min-w-0 flex-1 space-y-2">
				<Skeleton className="h-4 w-3/4 bg-accent-foreground/30" />
				<Skeleton className="h-3 w-1/2 bg-accent-foreground/30" />
			</div>
		</div>
	)
}
