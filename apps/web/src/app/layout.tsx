import type { Metadata } from "next"
import { Google_Sans } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "next-themes"
import { TelegramWrapper } from "@/providers/telegram-wrapper"

const gSans = Google_Sans({ subsets: ["latin"], fallback: ["Inter, sans-serif"] })

export const metadata: Metadata = {
	title: "Tma NextJS",
	description: "Boilerplate for building telegram mini app using nextjs!",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${gSans.className} antialiased`}>
				<ThemeProvider attribute="class" disableTransitionOnChange>
					<TelegramWrapper>{children}</TelegramWrapper>
				</ThemeProvider>
			</body>
		</html>
	)
}
