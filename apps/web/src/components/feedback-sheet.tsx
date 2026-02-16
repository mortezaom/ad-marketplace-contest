"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { request } from "@/lib/http"

interface FeedbackSheetProps {
	dealId: number
	trigger?: React.ReactNode
}

export function FeedbackSheet({ dealId, trigger }: FeedbackSheetProps) {
	const [open, setOpen] = useState(false)
	const [loading, setLoading] = useState(false)
	const [message, setMessage] = useState("")

	const handleSend = async () => {
		if (!message.trim()) {
			toast.error("Please enter a message")
			return
		}

		setLoading(true)
		const res = await request(`feedback/deal/${dealId}`, {
			method: "POST",
			json: { message: message.trim() },
		})
		setLoading(false)

		if (res.ok) {
			toast.success("Feedback sent!")
			setMessage("")
			setOpen(false)
		} else {
			toast.error(res.message || "Failed to send feedback")
		}
	}

	return (
		<Sheet onOpenChange={setOpen} open={open}>
			<SheetTrigger asChild>{trigger}</SheetTrigger>
			<SheetContent className="h-auto max-h-[70vh]" side="bottom">
				<SheetHeader>
					<SheetTitle>Send Feedback</SheetTitle>
				</SheetHeader>
				<div className="flex flex-col gap-4 p-4">
					<Textarea
						className="min-h-30"
						onChange={(e) => setMessage(e.target.value)}
						placeholder="Enter your feedback or message..."
						value={message}
					/>
					<Button className="w-full" disabled={loading || !message.trim()} onClick={handleSend}>
						{loading ? <Spinner className="h-4 w-4" /> : "Send Feedback"}
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	)
}
