import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export const formatNumber = (num: number): string => {
	if (num >= 1_000_000) {
		return `${(num / 1_000_000).toFixed(1)}M`
	}
	if (num >= 1000) {
		return `${(num / 1000).toFixed(1)}K`
	}
	return num.toString()
}

export const convertAdsFilter = (filters?: {
	status?: "open" | "in_progress" | "completed" | "cancelled"
	minBudget?: number
	maxBudget?: number
	language?: string
	adFormat?: "post" | "story" | "forward"
}) => {
	const params = new URLSearchParams()
	if (filters?.status) {
		params.set("status", filters.status)
	}
	if (filters?.minBudget) {
		params.set("minBudget", filters.minBudget.toString())
	}
	if (filters?.maxBudget) {
		params.set("maxBudget", filters.maxBudget.toString())
	}
	if (filters?.language) {
		params.set("language", filters.language)
	}
	if (filters?.adFormat) {
		params.set("adFormat", filters.adFormat)
	}

	return params.toString()
}
