"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function NewAdPage() {
	const router = useRouter()

	return (
		<main className="flex min-h-screen w-full flex-col items-center justify-start gap-4 px-4 py-2">
			<h1>New Advertisement Page</h1>
			<Button onClick={() => router.back()}>Back Home</Button>
		</main>
	)
}
