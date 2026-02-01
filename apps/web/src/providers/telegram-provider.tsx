// providers/telegram-provider.tsx
"use client"

import {
	init,
	isTMA,
	mainButton,
	themeParams,
	useLaunchParams,
	useSignal,
} from "@telegram-apps/sdk-react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { type PropsWithChildren, useEffect, useState } from "react"
import { ErrorScreen } from "@/components/error-screen"
import { LoadingBar } from "@/components/loading-bar"
import { useTelegramTheme } from "@/hooks/use-telegram-theme"

if (isTMA()) {
	init()
	themeParams.mountSync()
}

function ThemeSync() {
	useTelegramTheme()

	const isDark = useSignal(themeParams.isDark)

	const { setTheme } = useTheme()

	useEffect(() => {
		setTheme(() => (isDark ? "dark" : "light"))
	}, [isDark, setTheme])

	return null
}

function TmaContent({ children }: PropsWithChildren) {
	const [status, setStatus] = useState<"loading" | "ready">("loading")

	const launchParams = useLaunchParams(true)

	const pathname = usePathname()

	useEffect(() => {
		if (pathname === "/") {
			mainButton.mount()
			mainButton.setParams({ isVisible: true })
		} else {
			mainButton.setParams({ isVisible: false })
			mainButton.unmount()
		}
	}, [pathname])

	useEffect(() => {
		if (launchParams && themeParams.isMounted()) {
			setStatus("ready")
		}
	}, [launchParams])

	if (status === "loading") {
		return <LoadingBar className="flex min-h-screen items-center justify-center" />
	}

	return (
		<>
			<ThemeSync />
			{children}
		</>
	)
}

export function TelegramProvider({ children }: PropsWithChildren) {
	if (!isTMA()) {
		return <ErrorScreen message="Not a telegram environment!" />
	}

	return <TmaContent>{children}</TmaContent>
}
