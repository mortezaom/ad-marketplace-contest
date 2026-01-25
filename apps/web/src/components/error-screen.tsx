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
			<Alert className="flex flex-col gap-8 items-center justify-center w-96 h-64">
				<AlertCircle className="size-14!" />
				<AlertDescription className="text-lg font-semibold">{message}</AlertDescription>
			</Alert>
		</div>
	)
}
