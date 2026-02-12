"use client"

import { useRouter } from "next/navigation"
import { Fragment, useEffect, useState } from "react"
import type { ChannelModel } from "shared"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { request } from "@/lib/http"
import { setMainButton } from "@/lib/tma"
import { ChannelCard, ChannelCardSkeleton } from "./channel-card"
import { H4, P } from "./customized/typography"

export function ChannelsList() {
	const router = useRouter()
	useEffect(() => {
		setMainButton("channel", () => router.push("/channels/new"))
	}, [])

	const [channels, setChannels] = useState<ChannelModel[]>([])
	const [loading, setLoading] = useState(true)

	const loadChannels = async () => {
		setLoading(true)
		const res = await request<ChannelModel[]>("channels/get-channels")
		setLoading(false)

		if (res.ok) {
			setChannels(res.data)
		} else {
			setChannels([])
			toast.error("Failed to load channels!")
		}
	}

	useEffect(() => {
		loadChannels()
	}, [])

	const onChannelClicked = (channel: ChannelModel) => {
		router.push(`/channels/${channel.tgId}`)
	}

	return (
		<>
			{!loading && channels.length === 0 && (
				<div className="flex min-h-96 w-full flex-col items-center justify-center bg-background p-8 text-center">
					<H4>No Channel added Yet.</H4>
					<P className="text-muted-foreground text-sm">
						Add your first channel by clicking the button below.
					</P>
				</div>
			)}
			{loading && (
				<div className="flex w-full flex-col items-start justify-start gap-4">
					<ChannelCardSkeleton />
				</div>
			)}
			{!loading && channels.length > 0 && (
				<div className="flex w-full flex-col items-start justify-start">
					{channels.map((channel, index) => (
						<Fragment key={channel.tgLink}>
							{index > 0 && <Separator className="my-1" />}
							<ChannelCard channel={channel} onClick={() => onChannelClicked(channel)} />
						</Fragment>
					))}
				</div>
			)}
		</>
	)
}
