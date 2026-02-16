"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { H4 } from "@/components/customized/typography"
import { DealCreativeSection } from "@/components/deal-creative-section"
import { DealOverview } from "@/components/deal-overview"
import { Spinner } from "@/components/ui/spinner"
import { request } from "@/lib/http"
import { setBackButton } from "@/lib/tma"
import type { DealDetail } from "@/types/deals"

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const router = useRouter()
	const [loading, setLoading] = useState(true)
	const [deal, setDeal] = useState<DealDetail | null>(null)
	const [resolvedParams, setResolvedParams] = useState<{
		id: string
	} | null>(null)

	useEffect(() => {
		params.then((p) => setResolvedParams(p))
	}, [params])

	useEffect(() => {
		if (resolvedParams) {
			setBackButton(() => router.back())
		}
	}, [resolvedParams, router])

	const loadDeal = async () => {
		if (!resolvedParams) {
			return
		}

		setLoading(true)
		const res = await request<DealDetail>(`deals/${resolvedParams.id}`)
		setLoading(false)

		if (res.ok) {
			setDeal(res.data)
		} else {
			toast.error("Failed to load deal")
			router.back()
		}
	}

	useEffect(() => {
		if (resolvedParams) {
			loadDeal()
		}
	}, [resolvedParams])

	if (loading) {
		return (
			<main className="flex min-h-screen w-full items-center justify-center">
				<Spinner />
			</main>
		)
	}

	if (!deal) {
		return (
			<main className="flex min-h-screen w-full items-center justify-center">
				<H4>Deal Not Found</H4>
			</main>
		)
	}

	const isAdvertiser = deal.userRole === "advertiser"

	return (
		<main className="flex min-h-screen w-full flex-col gap-4 overflow-y-auto px-4 py-2">
			<DealOverview deal={deal} isAdvertiser={isAdvertiser} />

			<DealCreativeSection deal={deal} isAdvertiser={isAdvertiser} onUpdate={loadDeal} />
		</main>
	)
}
