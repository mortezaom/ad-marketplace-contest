"use client"

import { mainButton } from "@telegram-apps/sdk-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { H4, P } from "./customized/typography"

export function ChannelsList() {
	const router = useRouter()
	// biome-ignore lint/correctness/useExhaustiveDependencies: ignored
	useEffect(() => {
		if (mainButton.isMounted()) {
			mainButton.setParams({
				text: "Add Channel",
				isVisible: true,
				isEnabled: true,
			})
			mainButton.onClick(() => router.push("/channels/new"))
		}
	}, [])

	return (
		<div className="flex min-h-96 w-full flex-col items-center justify-center bg-background p-8 text-center">
			<H4>No Channel added Yet.</H4>
			<P className="text-muted-foreground text-sm">
				Add your first channel by clicking the button below.
			</P>
		</div>
	)
}
