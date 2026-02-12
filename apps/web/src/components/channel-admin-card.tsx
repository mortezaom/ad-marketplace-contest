import { UserMinus } from "lucide-react"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Skeleton } from "./ui/skeleton"

export interface ChannelAdmin {
	id: number
	tgUserId: number
	role: "owner" | "admin"
	addedAt: string
	user: {
		tid: number
		first_name: string
		last_name?: string
		photo_url?: string
		username?: string
	}
}

interface AdminCardProps {
	admin: ChannelAdmin
	isOwner: boolean
	isCurrentUser: boolean
	onDemote: (id: number) => void
}

export const AdminCard = ({ admin, isOwner, isCurrentUser, onDemote }: AdminCardProps) => {
	const fullName = `${admin.user.first_name} ${admin.user.last_name || ""}`.trim()
	const initials = fullName
		.split(" ")
		.map((n) => n[0])
		.join("")
		.slice(0, 2)
		.toUpperCase()

	return (
		<Card>
			<CardContent className="flex items-center justify-between px-4">
				<div className="flex items-center gap-3">
					<Avatar className="h-10 w-10">
						<AvatarImage src={admin.user.photo_url} />
						<AvatarFallback>{initials}</AvatarFallback>
					</Avatar>
					<div>
						<div className="flex items-center gap-2">
							<p className="font-medium text-sm">{fullName}</p>
							{isCurrentUser && (
								<Badge className="py-0 text-xs" variant="outline">
									You
								</Badge>
							)}
						</div>
						<div className="mt-2 flex items-center gap-2 text-muted-foreground text-xs">
							{admin.user.username && <span>@{admin.user.username}</span>}
							<span>·</span>
							<Badge
								className="py-0 text-xs"
								variant={admin.role === "owner" ? "default" : "secondary"}
							>
								{admin.role}
							</Badge>
						</div>
					</div>
				</div>

				{isOwner && !isCurrentUser && admin.role !== "owner" && (
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button className="h-8 w-8" size="icon" variant="ghost">
								<UserMinus className="h-4 w-4 text-destructive" />
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Demote Admin?</AlertDialogTitle>
								<AlertDialogDescription>
									This will remove {fullName}'s admin privileges from this channel.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
									onClick={() => onDemote(admin.id)}
								>
									Demote
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				)}
			</CardContent>
		</Card>
	)
}

export const AdminCardSkeleton = () => {
	return (
		<Card>
			<CardContent className="flex items-center gap-3 p-4">
				<Skeleton className="h-10 w-10 rounded-full" />
				<div className="flex-1 space-y-2">
					<Skeleton className="h-4 w-28" />
					<Skeleton className="h-3 w-20" />
				</div>
			</CardContent>
		</Card>
	)
}
