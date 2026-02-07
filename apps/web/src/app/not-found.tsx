"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function ErrorPage() {
	const router = useRouter()

	return (
		<div className="flex min-h-screen items-center justify-center">
			<main className="flex flex-col items-center justify-center gap-4">
				<h3>404 | Page Not Found</h3>

				<Button onClick={() => router.push("/")} variant="default">
					Go Home
				</Button>
			</main>
		</div>
	)
}
