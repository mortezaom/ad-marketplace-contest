"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { setMainButton } from "@/lib/tma"
import { H4, P } from "./customized/typography"

export function AdList() {
	const router = useRouter()
	useEffect(() => {
		setMainButton("ads", () => router.push("/advertisement/new"))
	}, [])

	return (
		<div className="flex min-h-96 w-full flex-col items-center justify-center bg-background p-8 text-center">
			<H4>No Advertisements Yet.</H4>

			<P className="text-muted-foreground text-sm">
				Add your first advertisement by clicking the button below.
			</P>
		</div>
	)
}
