"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { H4, P } from "@/components/customized/typography"
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

export function CreativeForm({ dealId, creative, initialContent }: CreativeFormProps) {
	const router = useRouter()
	const [content, setContent] = useState(initialContent)
	const [saving, setSaving] = useState(false)

	const handleSave = async (submit = false) => {
		if (!content.trim()) {
			toast.error("Please enter content for the creative")
			return
		}

		setSaving(true)

		try {
			const json = {
				content: content.trim(),
				...(submit && { status: "submitted" as const }),
			}

			const res = creative
				? await request(`creatives/${creative.id}`, { method: "PATCH", json })
				: await request(`creatives/deal/${dealId}`, { method: "POST", json })

			if (!res.ok) {
				toast.error(res.message || "Failed to save creative")
				return
			}

			const action = creative
				? submit
					? "submitted for review"
					: "saved"
				: submit
					? "submitted for review"
					: "created"

			toast.success(`Creative ${action}!`)
			router.back()
		} catch {
			toast.error("An error occurred")
		} finally {
			setSaving(false)
		}
	}

	const disabled = saving || !content.trim()

	return (
		<>
			<div className="flex flex-col gap-2">
				<H4>Your Draft Content</H4>
				<Textarea
					className="min-h-50"
					onChange={(e) => setContent(e.target.value)}
					placeholder="Write your ad content here..."
					value={content}
				/>
				<P className="text-muted-foreground text-xs">
					Write the content you want to post. The advertiser will review and approve it.
				</P>
			</div>

			<div className="mt-auto flex gap-2 pb-4">
				<Button
					className="flex-1"
					disabled={disabled}
					onClick={() => handleSave(false)}
					variant="outline"
				>
					{saving ? <Spinner className="h-4 w-4" /> : "Save Draft"}
				</Button>
				<Button className="flex-1" disabled={disabled} onClick={() => handleSave(true)}>
					{saving ? <Spinner className="h-4 w-4" /> : "Submit for Review"}
				</Button>
			</div>
		</>
	)
}
