// components/error-screen.tsx (new shadcn Alert/Dialog style)
"use client"

import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ErrorScreen({
	message = "This app only works in Telegram Mini Apps",
}: {
	message?: string
}) {
	return (
		<div className="flex h-screen w-full items-center justify-center bg-background p-8">
			<Alert className="flex h-64 w-96 flex-col items-center justify-center gap-8">
				<AlertCircle className="size-14!" />
				<AlertDescription className="font-semibold text-lg">{message}</AlertDescription>
			</Alert>
		</div>
	)
}
