"use client"

import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { useLaunchParams } from "@telegram-apps/sdk-react"
import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { AdList } from "@/components/ad-list"
import { ChannelsList } from "@/components/channels-list"
import { H4 } from "@/components/customized/typography"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export default function HomePage() {
	const userData = useLaunchParams().tgWebAppData?.user

	const [infoOpen, setInfoOpen] = useState(true)

	return (
		<main className="flex min-h-screen w-full flex-col items-center justify-start px-4 py-2">
			<div className="flex w-full max-w-3xl items-center justify-between px-2">
				<Avatar>
					<AvatarImage alt="@shadcn" src={userData?.photo_url} />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
				<Button
					className="cursor-pointer rounded-full"
					onClick={() => setInfoOpen(!infoOpen)}
					size="icon"
					variant="secondary"
				>
					<ChevronDown className={cn("transition", infoOpen ? "rotate-180" : "")} />
				</Button>
			</div>
			<div
				className={cn(
					"flex flex-col items-center justify-center overflow-hidden px-4 text-center transition-all",
					infoOpen ? "h-64 opacity-100" : "h-0 opacity-0"
				)}
			>
				<DotLottieReact
					autoplay
					className={cn("h-40", infoOpen ? "flex" : "hidden")}
					loop
					renderConfig={{
						devicePixelRatio: 1,
						freezeOnOffscreen: true,
					}}
					speed={0.8}
					src="/anims/welcome_anim.lottie"
				/>
				<H4>Welcome to MiniAd, Where advertising Meets Simplicity!</H4>
			</div>
			<Tabs className="mt-4 w-full" defaultValue="ads">
				<TabsList className="w-full">
					<TabsTrigger value="ads">Advertisements</TabsTrigger>
					<TabsTrigger value="channels">Channels</TabsTrigger>
				</TabsList>
				<TabsContent value="ads">
					<AdList />
				</TabsContent>
				<TabsContent value="channels">
					<ChannelsList />
				</TabsContent>
			</Tabs>
		</main>
	)
}
