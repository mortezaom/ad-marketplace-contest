import { openTelegramLink } from "@telegram-apps/sdk-react"
import { Fragment, useEffect, useState } from "react"
import type { ChannelModel } from "shared"
import { toast } from "sonner"
import { request } from "@/lib/http"
import { H4, P } from "./customized/typography"
import { Separator } from "./ui/separator"
import { VChannelDetailCard, VChannelDetailCardSkeleton } from "./verified-channel-card"

export const ChannelsCatalog = () => {
	const [loading, setLoading] = useState(false)
	const [channels, setChannels] = useState<ChannelModel[]>([])

	const loadChannels = async () => {
		setLoading(true)
		const res = await request<ChannelModel[]>("channels/public-channels")
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
		openTelegramLink(channel.tgLink)
	}

	return (
		<>
			{!loading && channels.length === 0 && (
				<div className="flex min-h-96 w-full flex-col items-center justify-center bg-background p-8 text-center">
					<H4>No Verified Channel Yet.</H4>
					<P className="text-muted-foreground text-sm">
						You may see more verified channels here next time.
					</P>
				</div>
			)}
			{loading && (
				<div className="flex w-full flex-col items-start justify-start gap-4">
					<VChannelDetailCardSkeleton />
				</div>
			)}
			{!loading && channels.length > 0 && (
				<div className="flex w-full flex-col items-start justify-start">
					{channels.map((channel, index) => (
						<Fragment key={channel.tgLink}>
							{index > 0 && <Separator className="my-1" />}
							<VChannelDetailCard channel={channel} onClick={() => onChannelClicked(channel)} />
						</Fragment>
					))}
				</div>
			)}
		</>
	)
}
