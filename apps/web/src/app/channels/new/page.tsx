"use client"

import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { copyTextToClipboard } from "@telegram-apps/sdk-react"
import { AlertTriangleIcon, CopyIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { ChannelModel } from "shared"
import { toast } from "sonner"
import { H3, H4 } from "@/components/customized/typography"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { request } from "@/lib/http"
import { usernameRegex } from "@/lib/tma"
import { cn } from "@/lib/utils"

interface AgentResponse {
	channelId: number
	agent: AgentData
}

interface AgentData {
	id: number
	accountId: number
	accountName: string
	username: string
}

export default function NewAdPage() {
	const router = useRouter()

	const [agent, setAgent] = useState<AgentData | null>(null)
	const [channelId, setChannelId] = useState("")

	const [channelData, setChannelData] = useState<ChannelModel | null>(null)

	const [loading, setLoading] = useState(false)
	const [channelValid, setChannelValid] = useState(true)

	const [isSuccess, setIsSuccess] = useState(false)

	const loadData = async () => {
		const res = await request<AgentResponse>("channels/agent-for-channel", {
			method: "POST",
		})

		if (res.ok) {
			setAgent(res.data.agent)
		}
	}

	const verifyChannel = async () => {
		if (!agent) {
			return
		}
		const username = channelId.replace("@", "").trim()
		if (!usernameRegex.test(username)) {
			toast.error("Invalid Channel ID.")
			setChannelValid(false)
			return
		}
		setChannelValid(true)
		setLoading(true)
		const res = await request<{ message: string; channel: ChannelModel }>(
			"channels/verify-channel",
			{
				method: "post",
				json: {
					channelId,
					accountId: agent.id,
				},
			}
		)
		setLoading(false)

		if (res.ok) {
			setChannelData(res.data.channel)
			setIsSuccess(true)
		} else {
			toast.error(res.message)
		}
	}

	const copyId = () => {
		if (agent?.username.length) {
			copyTextToClipboard(`@${agent.username}`)
		}
	}

	useEffect(() => {
		loadData()
	}, [])

	return (
		<main className="flex min-h-screen w-full flex-col items-center justify-start gap-4 overflow-hidden">
			<AnimatePresence mode="wait">
				{isSuccess ? (
					<motion.div
						animate={{ opacity: 1, scale: 1 }}
						className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 text-center"
						exit={{ opacity: 0, scale: 0.9 }}
						initial={{ opacity: 0, scale: 0.9 }}
						key="success-view"
						transition={{ type: "spring", damping: 20, stiffness: 300 }}
					>
						<DotLottieReact
							autoplay
							className={cn("w-full", isSuccess ? "flex" : "hidden")}
							loop
							renderConfig={{
								devicePixelRatio: 1,
								freezeOnOffscreen: true,
							}}
							speed={0.8}
							src="/anims/success_anim.lottie"
						/>
						<div>
							<H3>You're all set!</H3>
							<br />
							<p className="text-muted-foreground">
								Your channel has been successfully added. You can apply for advertisements now.
							</p>

							<br />

							<div className="flex flex-col">
								<div className="mt-4 flex flex-wrap items-center justify-center">
									<Badge className="text-muted-foreground" variant="ghost">
										Channel Name: {channelData?.title ?? "N/A"}
									</Badge>
									<Badge className="text-muted-foreground" variant="ghost">
										Average Views: {channelData?.avgPostReach ?? "N/A"}
									</Badge>
									<Badge className="text-muted-foreground" variant="ghost">
										Followers Count: {channelData?.subCount ?? "N/A"}
									</Badge>
								</div>
							</div>
						</div>
						<Button
							onClick={() => router.replace(`/channels/${channelData?.tgId}`)}
							variant="default"
						>
							Go to Channel Details
						</Button>
					</motion.div>
				) : (
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className="flex w-full flex-col items-center justify-start gap-4 px-8 py-4"
						exit={{ opacity: 0, y: -10 }}
						initial={{ opacity: 0, y: 10 }}
						key="input-view"
						transition={{ duration: 0.2 }}
					>
						<H4>Add your Channel</H4>

						<Alert className="max-w-md border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950 dark:text-white">
							<AlertTriangleIcon />
							<AlertTitle>Attention</AlertTitle>
							<AlertDescription>
								In order to retrieve your channel's info, MiniAd agent should be added to your
								channel as admin.
							</AlertDescription>
						</Alert>

						<Field>
							<FieldLabel className="mb-1" htmlFor="input-badge">
								Agent ID
							</FieldLabel>
							<ButtonGroup>
								<Input
									disabled
									id="input-badge"
									placeholder="Loading ..."
									type="url"
									value={agent ? `@${agent.username}` : ""}
								/>
								<Button onClick={copyId} variant="link">
									Copy
									<CopyIcon className="size-3" />
								</Button>
							</ButtonGroup>
						</Field>

						<Separator className="mt-4 mb-2 bg-primary/20" />

						<div className="w-full">
							<CardHeader className="p-0">
								<CardTitle>Verify</CardTitle>
								<CardDescription>
									After adding agent account to your channel, click verify to examine the process
								</CardDescription>
							</CardHeader>
							<CardContent className="mt-3 flex flex-col p-0">
								<Field aria-invalid={!channelValid} className="w-full">
									<FieldLabel htmlFor="input-group-url">Channel ID</FieldLabel>
									<InputGroup className="w-full">
										<ButtonGroup>
											<InputGroupInput
												aria-invalid={!channelValid}
												disabled={loading}
												id="input-group-url"
												onChange={(e) => setChannelId(e.target.value)}
												placeholder="drove"
												value={channelId}
											/>
										</ButtonGroup>
										<InputGroupAddon>
											<InputGroupText>@</InputGroupText>
										</InputGroupAddon>
									</InputGroup>
								</Field>
								<br />
								<Button
									className="mt-6 text-xs"
									disabled={loading}
									onClick={verifyChannel}
									variant="default"
								>
									Verify
									{loading && <Spinner data-icon="inline-start" />}
								</Button>
							</CardContent>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</main>
	)
}
