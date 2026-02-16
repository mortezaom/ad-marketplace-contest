import { TonConnectButton, useTonAddress, useTonConnectUI } from "@tonconnect/ui-react"
import { useEffect, useState } from "react"
import type { ChannelModel } from "shared"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
	FieldSet,
} from "@/components/ui/field"
import { request } from "@/lib/http"
import { P } from "./customized/typography"
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group"
import { Spinner } from "./ui/spinner"
import { Switch } from "./ui/switch"

export interface ListingBodyType {
	postPrice: number
	storyPrice: number
	forwardPrice: number
	isPublic: boolean
}

interface ChannelListingProps {
	channel: ChannelModel
	onSaved: (p1: ListingBodyType) => void
}

export function ChannelListingContent({ channel, onSaved }: ChannelListingProps) {
	const [loading, setLoading] = useState(false)

	const walletAddress = useTonAddress(true)
	const [tonConnectUI] = useTonConnectUI()

	const [postPrice, setPostPrice] = useState(`${channel.listingInfo.postPrice ?? ""}`)
	const [storyPrice, setStoryPrice] = useState(`${channel.listingInfo.storyPrice ?? ""}`)
	const [forwardPrice, setForwardPrice] = useState(`${channel.listingInfo.forwardPrice ?? ""}`)

	const [isPublic, setIsPublic] = useState(channel.isPublic)

	const [localWallet, setLocalWallet] = useState<string | undefined>()

	const onSave = async () => {
		setLoading(true)
		const json = {
			postPrice: Number(postPrice),
			storyPrice: Number(storyPrice),
			forwardPrice: Number(forwardPrice),
			isPublic,
		}
		const res = await request<object>(`channels/${channel.tgId}/listing`, {
			method: "post",
			json,
		})
		setLoading(false)
		if (res.ok) {
			toast.success("Listing preference saved!")
			onSaved(json)
		} else {
			toast.error(res.message)
		}
	}

	const onWalletAddressReceived = async (walletAddress: string) => {
		const json = {
			walletAddress: `${walletAddress}`,
		}
		const res = await request<object>(`channels/${channel.tgId}/save-wallet`, {
			method: "put",
			json,
		})
		if (res.ok) {
			await tonConnectUI.disconnect()
			setLocalWallet(json.walletAddress)
		} else {
			toast.error(res.message)
		}
	}

	useEffect(() => {
		if (walletAddress && !channel.walletAddress) {
			onWalletAddressReceived(walletAddress)
		}
	}, [walletAddress])

	const getWalletAbb = () => {
		const wallet = channel.walletAddress || localWallet
		if (wallet) {
			return `${wallet.substring(0, 4)} ... ${wallet.substring(wallet.length -5)}`
		}
		return ""
	}

	return (
		<div className="w-full">
			<form>
				<FieldGroup>
					<FieldSet>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="post-price">Post Price</FieldLabel>
								<InputGroup id="post-price">
									<InputGroupInput
										onChange={(e) => setPostPrice(e.target.value)}
										placeholder="0"
										type="number"
										value={postPrice}
									/>
									<InputGroupAddon align="inline-end">TON</InputGroupAddon>
								</InputGroup>
							</Field>
							<Field>
								<FieldLabel htmlFor="story-price">Story Price</FieldLabel>
								<InputGroup id="story-price">
									<InputGroupInput
										onChange={(e) => setStoryPrice(e.target.value)}
										placeholder="0"
										type="number"
										value={storyPrice}
									/>
									<InputGroupAddon align="inline-end">TON</InputGroupAddon>
								</InputGroup>
							</Field>
							<Field>
								<FieldLabel htmlFor="forwarding-price">Post Forwarding Price</FieldLabel>
								<InputGroup id="forwarding-price">
									<InputGroupInput
										onChange={(e) => setForwardPrice(e.target.value)}
										placeholder="0"
										type="number"
										value={forwardPrice}
									/>
									<InputGroupAddon align="inline-end">TON</InputGroupAddon>
								</InputGroup>
							</Field>
						</FieldGroup>
					</FieldSet>
					<FieldSeparator />
					<FieldSet>
						<FieldGroup>
							<Field orientation="horizontal">
								<FieldLabel>
									{channel.walletAddress || localWallet ? "Connected" : "Not Connected"}
								</FieldLabel>

								{channel.walletAddress || localWallet ? (
									<P className="font-semibold">{getWalletAbb()}</P>
								) : (
									<TonConnectButton />
								)}
							</Field>
						</FieldGroup>
						<FieldDescription>
							Your wallet address will be attached to this telegram account for payouts
						</FieldDescription>
					</FieldSet>
					<FieldSeparator />
					<FieldSet>
						<FieldGroup>
							<Field orientation="horizontal">
								<Switch checked={isPublic} id="public-check" onCheckedChange={setIsPublic} />
								<FieldLabel className="font-normal" htmlFor="public-check">
									Public Profile
								</FieldLabel>
							</Field>
						</FieldGroup>
						<FieldDescription>
							People can see your profile and you may get Ad proposals!
						</FieldDescription>
					</FieldSet>
					<Field>
						<Button disabled={loading} onClick={onSave} type="button">
							Save
							{loading && <Spinner data-icon="inline-start" />}
						</Button>
					</Field>
				</FieldGroup>
			</form>
		</div>
	)
}
