// components/loading-bar.tsx
"use client"

import { cn } from "@/lib/utils"
import SwirlingEffectSpinner from "./customized/spinner/spinner-06"

export function LoadingBar({ className }: { className?: string }) {
	return (
		<div className={cn(className)}>
			<SwirlingEffectSpinner />
		</div>
	)
}
