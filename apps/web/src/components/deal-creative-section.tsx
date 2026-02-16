"use client"

import { Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { H4, P } from "@/components/customized/typography"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { request } from "@/lib/http"
import { creativeStatusVariants, formatStatus } from "@/lib/utils"
import type { DealDetail } from "@/types/deals"

type CreativeAction = "submitted" | "approved" | "revision_requested"

interface DealCreativeSectionProps {
	deal: DealDetail
	isAdvertiser: boolean
	onUpdate: () => void
}

export function DealCreativeSection({ deal, isAdvertiser, onUpdate }: DealCreativeSectionProps) {
	const router = useRouter()
	const [actionLoading, setActionLoading] = useState(false)

	const { creative } = deal
	const canSubmit = !isAdvertiser && creative?.status === "draft"
	const canApprove = isAdvertiser && creative?.status === "submitted"
	const canEdit = isAdvertiser
		? creative?.status === "submitted"
		: creative?.status === "draft" || !creative

	const handleAction = async (action: CreativeAction, reviewNote?: string) => {
		if (!creative) {
			return
		}

		setActionLoading(true)
		const res = await request(`creatives/${creative.id}`, {
			method: "PATCH",
			json: {
				status: action,
				...(reviewNote && { reviewNote }),
			},
		})
		setActionLoading(false)

		if (res.ok) {
			toast.success(action === "submitted" ? "Creative submitted!" : "Review updated!")
			onUpdate()
		} else {
			toast.error(res.message || "Failed to update creative")
		}
	}

	const goToCreative = () => router.push(`/deals/${deal.id}/creative`)

	return (
		<>
			<div className="flex flex-col gap-3">
				<H4>Creative (Draft)</H4>

				{creative ? (
					<div className="rounded-lg border p-4">
						<div className="flex items-center justify-between">
							<Badge variant={creativeStatusVariants[creative.status] || "outline"}>
								{formatStatus(creative.status)}
							</Badge>
							<span className="text-muted-foreground text-xs">Version {creative.version}</span>
						</div>

						<div className="mt-3 whitespace-pre-wrap text-sm">{creative.content}</div>

						{creative.reviewNote && (
							<div className="mt-3 rounded bg-muted/50 p-2 text-sm">
								<span className="font-semibold">Review Note:</span> {creative.reviewNote}
							</div>
						)}

						{canSubmit && (
							<div className="mt-4 flex gap-2">
								<Button
									className="flex-1"
									disabled={actionLoading}
									onClick={() => handleAction("submitted")}
								>
									{actionLoading ? <Spinner className="h-4 w-4" /> : "Submit for Review"}
								</Button>
								<Button disabled={actionLoading} onClick={goToCreative} variant="outline">
									<Edit className="mr-2 h-4 w-4" />
									Edit
								</Button>
							</div>
						)}

						{canApprove && (
							<div className="mt-4 flex gap-2">
								<Button
									className="flex-1"
									disabled={actionLoading}
									onClick={() => handleAction("approved")}
								>
									{actionLoading ? <Spinner className="h-4 w-4" /> : "Approve"}
								</Button>
								<Button
									className="flex-1"
									disabled={actionLoading}
									onClick={() => handleAction("revision_requested", "Please revise and resubmit")}
									variant="destructive"
								>
									{actionLoading ? <Spinner className="h-4 w-4" /> : "Request Revision"}
								</Button>
							</div>
						)}

						{!(canEdit || canSubmit || canApprove) && (
							<Button
								className="mt-4 w-full"
								disabled={actionLoading}
								onClick={goToCreative}
								variant="outline"
							>
								<Edit className="mr-2 h-4 w-4" />
								{creative.status === "approved" ? "View Creative" : "View/Edit Creative"}
							</Button>
						)}
					</div>
				) : (
					<div className="rounded-lg border border-dashed p-6 text-center">
						<P className="text-muted-foreground">No creative submitted yet</P>
						{!isAdvertiser && (
							<Button className="mt-3" onClick={goToCreative}>
								Create Draft
							</Button>
						)}
					</div>
				)}
			</div>
			<Separator />
		</>
	)
}
