// components/ads/ApplicationReviewSheet.tsx
import { openTelegramLink } from "@telegram-apps/sdk-react"
import { LinkIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import type { AdRequestDetail, Application } from "@/app/advertisement/[...id]/page"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { getChannelPhoto, request } from "@/lib/http"
import { transformStatus } from "@/lib/utils"

interface ApplicationReviewSheetProps {
	application: Application | null
	adRequest: AdRequestDetail
	onOpenChange: (open: boolean) => void
	onRefresh: () => void
}

export function ApplicationReviewSheet({
	adRequest,
	application,
	onOpenChange,
	onRefresh,
}: ApplicationReviewSheetProps) {
	const [loading, setLoading] = useState(false)
	const router = useRouter()

	const handleSheetAction = async (type: "accepted" | "rejected") => {
		if (!application) {
			return
		}

		setLoading(true)
		const res = await request(`ads/${adRequest.id}/applications/${application.id}`, {
			method: "PATCH",
			json: {
				status: type,
			},
		})
		setLoading(false)

		if (res.ok) {
			onOpenChange(false)
			onRefresh()
			if (type === "accepted") {
				toast.success("Application accepted! Redirecting to deals...")
				// Navigate to deals page
				router.push("/")
				// Switch to deals tab - this will happen automatically since we go to home page with deals as default
			}
		} else {
			toast.error(res.message)
		}
	}

	return (
		<Sheet onOpenChange={onOpenChange} open={!!application}>
			<SheetContent className="overflow-y-auto" side="bottom">
				<SheetHeader>
					<SheetTitle>Review Application</SheetTitle>
				</SheetHeader>
				{application && (
					<div className="flex flex-col gap-4 px-4 pb-2">
						<div className="flex items-center gap-3">
							<Avatar className="h-12 w-12">
								<AvatarImage src={getChannelPhoto(application.channel.tgLink)} />
								<AvatarFallback>
									{(application.channel.title || "C").charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<div className="flex flex-col gap-1">
								<span className="font-semibold text-base leading-tight">
									{application.channel.title || "Untitled Channel"}
								</span>
								<Button
									className="flex h-auto items-center gap-1 p-0! text-primary text-xs"
									onClick={() => openTelegramLink(application.channel.tgLink)}
									variant={"link"}
								>
									<LinkIcon className="h-3! w-3!" />
									{application.channel.tgLink}
								</Button>
							</div>

							{application.status !== "pending" && (
								<Badge
									className="ml-auto font-normal capitalize"
									variant={application.status === "accepted" ? "default" : "destructive"}
								>
									{transformStatus(application.status)}
								</Badge>
							)}
						</div>

						<div className="grid grid-cols-2 gap-2">
							<div className="flex flex-col items-center rounded-lg border py-3">
								<span className="text-[11px] text-muted-foreground">Subscribers</span>
								<span className="font-semibold text-base">
									{application.channel.subCount.toLocaleString()}
								</span>
							</div>
							<div className="flex flex-col items-center rounded-lg border py-3">
								<span className="text-[11px] text-muted-foreground">Avg. Reach</span>
								<span className="font-semibold text-base">
									{application.channel.avgPostReach
										? application.channel.avgPostReach.toLocaleString()
										: "N/A"}
								</span>
							</div>
						</div>

						{application.channel.languages.length > 0 && (
							<div className="flex flex-col gap-2">
								<span className="text-muted-foreground text-xs">Languages</span>
								<div className="flex flex-wrap gap-1.5">
									{(() => {
										const total = application.channel.languages.reduce(
											(sum: number, l: { total: number }) => sum + l.total,
											0
										)
										return application.channel.languages.map(
											(lang: { name: string; total: number }) => (
												<Badge className="font-normal" key={lang.name} variant="outline">
													{lang.name} {((lang.total / total) * 100).toFixed(0)}%
												</Badge>
											)
										)
									})()}
								</div>
							</div>
						)}

						<div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm">
							<span className="text-muted-foreground">Applied</span>
							<span className="font-medium">
								{new Date(application.appliedAt).toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
									year: "numeric",
								})}
							</span>
						</div>

						{application.status === "pending" && (
							<>
								<Separator />

								<div className="flex gap-3">
									<Button
										className="flex-1"
										disabled={loading}
										onClick={() => handleSheetAction("accepted")}
									>
										{loading ? <Spinner className="h-4 w-4" /> : "Accept"}
									</Button>
									<Button
										className="flex-1"
										disabled={loading}
										onClick={() => handleSheetAction("rejected")}
										variant="destructive"
									>
										{loading ? <Spinner className="h-4 w-4" /> : "Reject"}
									</Button>
								</div>
							</>
						)}
					</div>
				)}
			</SheetContent>
		</Sheet>
	)
}
