// providers/telegram-provider.tsx
"use client"

import {
	init,
	isTMA,
	mainButton,
	themeParams,
	useRawInitData,
	useSignal,
} from "@telegram-apps/sdk-react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { type PropsWithChildren, useEffect, useState } from "react"
import type { UserModel } from "shared"
import { toast } from "sonner"
import { ErrorScreen } from "@/components/error-screen"
import { LoadingBar } from "@/components/loading-bar"
import { useTelegramTheme } from "@/hooks/use-telegram-theme"
import { request } from "@/lib/http"
import { authStorage } from "@/lib/storage"

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

async function submitInitData(launchParams: string | undefined) {
	const response = await request<{ user: UserModel }>("users", {
		method: "POST",
		body: JSON.stringify({
			initData: launchParams ?? "",
		}),
	})

	if (!response.ok) {
		toast.error("Something went wrong during user authentication. Please try again.")
		return
	}

	authStorage.setUser(response.data.user)
}

function TmaContent({ children }: PropsWithChildren) {
	const [status, setStatus] = useState<"loading" | "ready">("loading")

	const rawInitData = useRawInitData()

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
		if (rawInitData && themeParams.isMounted()) {
			submitInitData(rawInitData).then(() => {
				setStatus("ready")
			})
		}
	}, [rawInitData])

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
