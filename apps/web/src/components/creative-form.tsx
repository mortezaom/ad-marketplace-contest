"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { H5, P } from "@/components/customized/typography"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { request } from "@/lib/http"
import type { CreativeDetail } from "@/types/deals"

interface CreativeFormProps {
	dealId: number
	creative: CreativeDetail | null
	initialContent: string
}

export function CreativeForm({ dealId, initialContent, creative }: CreativeFormProps) {
	const router = useRouter()
	const [content, setContent] = useState(initialContent)
	const [saving, setSaving] = useState(false)

	const handleSave = async () => {
		if (!content.trim()) {
			toast.error("Please enter content for the creative")
			return
		}

		setSaving(true)

		try {
			const json = {
				content: content.trim(),
			}

			const res = await request(`creatives/deal/${dealId}`, { method: "POST", json })

			if (!res.ok) {
				toast.error(res.message || "Failed to save creative")
				return
			}

			toast.success("Creative submitted for review!")
			router.back()
		} catch {
			toast.error("An error occurred")
		} finally {
			setSaving(false)
		}
	}

	const disabled = saving || !content.trim() || creative?.status === "approved"

	const isApproved = creative?.status === "approved"

	return (
		<>
			<div className="flex flex-col gap-2">
				<H5 className="text-base">Draft Content</H5>
				<Textarea
					className="min-h-50 text-sm"
					disabled={disabled}
					onChange={(e) => setContent(e.target.value)}
					placeholder="Write ad content here..."
					value={content}
				/>

				{!isApproved && (
					<P className="text-muted-foreground text-xs">
						Write the content you want to post. The advertiser will review and approve it.
					</P>
				)}
			</div>

			{isApproved ? (
				<br />
			) : (
				<div className="mt-auto flex gap-2 pb-4">
					<Button className="flex-1" disabled={disabled} onClick={handleSave} variant="outline">
						{saving ? <Spinner className="h-4 w-4" /> : "Save Draft"}
					</Button>
				</div>
			)}
		</>
	)
}
