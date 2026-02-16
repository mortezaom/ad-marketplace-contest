"use client"

import { Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { H5, P } from "@/components/customized/typography"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { request } from "@/lib/http"
import { creativeStatusVariants, transformStatus } from "@/lib/utils"
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

	const handleAction = async (action: CreativeAction) => {
		if (!creative) {
			return
		}

		setActionLoading(true)
		const res = await request(`creatives/${creative.id}`, {
			method: "PATCH",
			json: {
				status: action,
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
				<H5>Creative (Draft)</H5>

				{creative ? (
					<div className="rounded-lg border p-4">
						<div className="flex items-center justify-between">
							<Badge variant={creativeStatusVariants[creative.status] || "outline"}>
								{transformStatus(creative.status)}
							</Badge>
							<span className="text-muted-foreground text-xs">Version {creative.version}</span>
						</div>

						<div className="mt-3 whitespace-pre-wrap text-sm">{creative.content}</div>

						{canSubmit && !isAdvertiser && (
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
									New
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
									onClick={() => handleAction("revision_requested")}
									variant="destructive"
								>
									{actionLoading ? <Spinner className="h-4 w-4" /> : "Request Revision"}
								</Button>
							</div>
						)}

						{!(isAdvertiser || canSubmit) && (
							<Button
								className="mt-4 w-full"
								disabled={actionLoading}
								onClick={goToCreative}
								variant="outline"
							>
								<Edit className="mr-2 h-4 w-4" />
								{creative.status === "approved" ? "View Creative" : "Revise Creative"}
							</Button>
						)}
						{(isAdvertiser && creative?.status === "approved") && (
							<Button
								className="mt-4 w-full"
								disabled={actionLoading}
								onClick={goToCreative}
								variant="outline"
							>
								<Edit className="mr-2 h-4 w-4" />
								{creative.status === "approved" ? "View Creative" : "Revise Creative"}
							</Button>
						)}
					</div>
				) : (
					<div className="rounded-lg border border-dashed p-8 text-center">
						<P className="text-muted-foreground text-sm">No creative submitted yet</P>
						{!isAdvertiser && (
							<Button className="mt-3" onClick={goToCreative} size={"sm"}>
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
