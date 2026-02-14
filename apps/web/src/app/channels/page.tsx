"use client"

import { ChannelsList } from "@/components/channels-list"
import { H4 } from "@/components/customized/typography"

export  default function ChannelsListPage(){
	return (
		<main className="flex min-h-screen w-full flex-col items-start justify-start gap-4 px-4 py-2">
			<H4 className="ml-2">My Channels</H4>

			<ChannelsList />
		</main>
	)
}
