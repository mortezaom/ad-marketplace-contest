"use client"

import { useLaunchParams } from "@telegram-apps/sdk-react"
import { ExternalLink, MoreVertical } from "lucide-react"
import { use, useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import type { ChannelModel } from "shared"
import { AddAdminSheet } from "@/components/add-admin-sheet"
import { AdminCard, AdminCardSkeleton, type ChannelAdmin } from "@/components/channel-admin-card"
import { ChannelListingContent, type ListingBodyType } from "@/components/channel-listing-content"
import { StatCard } from "@/components/channel-stat-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getChannelPhoto, request } from "@/lib/http"
import { formatNumber } from "@/lib/utils"

const chartConfig = {
	posts: {
		label: "Ads",
		color: "hsl(var(--primary))",
	},
}

export interface WeeklyStat {
	day: string
	posts: number
}

export interface ChannelPageProps {
	params: Promise<{ id: string }>
}

export interface LanguageStats {
	name: string
	total: number
}

export default function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
	const { id: channelId } = use(params)
	const launchParams = useLaunchParams()
	const currentUserTid = launchParams?.tgWebAppData?.user?.id

	const [channel, setChannel] = useState<ChannelModel | null>(null)
	const [admins, setAdmins] = useState<ChannelAdmin[]>([])
	const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([])
	const [loading, setLoading] = useState(true)
	const [adminsLoading, setAdminsLoading] = useState(false)

	const totalLangCount = (channel?.languages ?? []).reduce((acc, v) => acc + v.total, 0)

	useEffect(() => {
		fetchChannelData()
	}, [channelId])

	const fetchChannelData = async () => {
		const { ok, data, message } = await request<{
			channel: ChannelModel
			weeklyStats: WeeklyStat[]
		}>(`channels/${channelId}`)

		if (ok && data) {
			setChannel(data.channel)
			setWeeklyStats(data.weeklyStats || [])
		} else {
			console.error("Failed to fetch channel:", message)
		}

		setLoading(false)
	}

	const fetchAdmins = async () => {
		setAdminsLoading(true)
		setAdmins([])

		const { ok, data, message } = await request<{ admins: ChannelAdmin[] }>(
			`channels/${channelId}/admins`
		)

		if (ok && data) {
			setAdmins(data.admins)
		} else {
			console.error("Failed to fetch admins:", message)
		}

		setAdminsLoading(false)
	}

	const onListingChanged = (body: ListingBodyType) => {
		if (!channel) { return }
		setChannel({
			...channel,
			listingInfo: body,
		})
	}

	const handleDemoteAdmin = async (adminId: number) => {
		const { ok, message } = await request(`channels/${channelId}/admins/${adminId}`, {
			method: "DELETE",
		})

		if (ok) {
			setAdmins(admins.filter((a) => a.id !== adminId))
		} else {
			console.error("Failed to demote admin:", message)
		}
	}

	const handleTabChange = (tab: string) => {
		if (tab === "admins" && admins.length === 0) {
			fetchAdmins()
		}
	}

	const isOwner = admins.some(
		(a) => String(a.tgUserId) === String(currentUserTid) && a.role === "owner"
	)

	if (loading) {
		return <ChannelPageSkeleton />
	}

	if (!channel) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center">
				<p className="text-muted-foreground">Channel not found</p>
			</div>
		)
	}

	const renderAdminsContent = () => {
		if (adminsLoading) {
			return (
				<div className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<AdminCardSkeleton key={i} />
					))}
				</div>
			)
		}

		if (admins.length === 0) {
			return (
				<Card>
					<CardContent className="flex items-center justify-center py-12">
						<p className="text-muted-foreground">No admins found</p>
					</CardContent>
				</Card>
			)
		}

		return (
			<div className="space-y-2">
				{admins.map((admin) => (
					<AdminCard
						admin={admin}
						isCurrentUser={String(admin.tgUserId) === String(currentUserTid)}
						isOwner={isOwner}
						key={admin.id}
						onDemote={handleDemoteAdmin}
					/>
				))}
				<Separator className="my-7" />
				<AddAdminSheet channel={channel} onAdminAdded={fetchAdmins} />
			</div>
		)
	}

	const getChannelAtId = () => {
		return `${channel.tgLink.split("/").pop()}`
	}

	return (
		<div className="container mx-auto max-w-4xl px-4 py-6">
			<div className="mb-6 flex items-start justify-between">
				<div className="flex items-center gap-4">
					<Avatar className="h-14 w-14">
						<AvatarImage src={getChannelPhoto(channel.tgLink)} />
						<AvatarFallback>{channel.title?.charAt(0).toUpperCase()}</AvatarFallback>
					</Avatar>
					<div>
						<h1 className="font-bold text-xl">{channel.title}</h1>
						<a
							className="text-muted-foreground text-sm hover:underline"
							href={`https://t.me/${getChannelAtId()}`}
							rel="noopener noreferrer"
							target="_blank"
						>
							@{getChannelAtId()}
						</a>
					</div>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button size="icon" variant="ghost">
							<MoreVertical className="h-5 w-5" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							onClick={() => window.open(`https://t.me/${channel.tgLink}`, "_blank")}
						>
							<ExternalLink className="mr-2 h-4 w-4" />
							Open in Telegram
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<Tabs defaultValue="info" onValueChange={handleTabChange}>
				<TabsList className="mb-6 grid w-full grid-cols-3">
					<TabsTrigger value="info">Info & Stats</TabsTrigger>
					<TabsTrigger value="listing">Listing</TabsTrigger>
					<TabsTrigger value="admins">Admins</TabsTrigger>
				</TabsList>

				<TabsContent className="space-y-6" value="info">
					<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
						<StatCard title="Subscribers" value={formatNumber(channel.subCount)} />
						<StatCard title="Avg. Reach" value={formatNumber(channel.avgPostReach || 0)} />
						<StatCard title="Offers" value={channel.offersCount || 0} />
						<StatCard title="Ads Published" value={channel.adsPublished || 0} />
					</div>

					{channel.languages.length > 0 && (
						<Card className="py-4">
							<CardHeader className="px-4">
								<CardTitle className="text-sm">Languages</CardTitle>
							</CardHeader>
							<CardContent className="px-4">
								<div className="flex flex-wrap gap-2">
									{channel.languages.map((lang) => (
										<Badge key={lang.name} variant="secondary">
											{lang.name} ({((lang.total * 100) / totalLangCount).toFixed(0)}%)
										</Badge>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{weeklyStats.length > 0 && (
						<Card className="px-0">
							<CardHeader className="px-4">
								<CardTitle className="text-base">Ads Published (Last 7 Days)</CardTitle>
							</CardHeader>
							<CardContent className="px-0">
								<ChartContainer className="h-50 w-full pr-4" config={chartConfig}>
									<BarChart accessibilityLayer data={weeklyStats}>
										<CartesianGrid strokeDasharray="3 3" vertical={false} />
										<XAxis
											axisLine={false}
											dataKey="day"
											fontSize={12}
											tickLine={false}
											tickMargin={8}
										/>
										<YAxis axisLine={false} fontSize={12} tickLine={false} tickMargin={8} />
										<ChartTooltip content={<ChartTooltipContent />} />
										<Bar
											className="text-card-foreground/70"
											dataKey="posts"
											fill="currentColor"
											radius={[4, 4, 0, 0]}
										/>
									</BarChart>
								</ChartContainer>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				<TabsContent className="space-y-6" value="listing">
					<ChannelListingContent channel={channel} onSaved={onListingChanged} />
				</TabsContent>

				<TabsContent value="admins">{renderAdminsContent()}</TabsContent>
			</Tabs>
		</div>
	)
}

export const ChannelPageSkeleton = () => {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-6">
			<div className="mb-6 flex items-start gap-4">
				<Skeleton className="h-14 w-14 rounded-full" />
				<div className="space-y-2">
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-3 w-28" />
				</div>
			</div>
			<Skeleton className="mb-6 h-10 w-full" />
			<div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
				<Skeleton className="h-20" />
				<Skeleton className="h-20" />
				<Skeleton className="h-20" />
				<Skeleton className="h-20" />
			</div>
			<Skeleton className="h-55" />
		</div>
	)
}
