"use client"

import { themeParams, useSignal } from "@telegram-apps/sdk-react"
import { useEffect } from "react"

function hexToOklch(hex: string): string {
	const r = parseInt(hex.slice(1, 3), 16) / 255
	const g = parseInt(hex.slice(3, 5), 16) / 255
	const b = parseInt(hex.slice(5, 7), 16) / 255

	const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

	const lr = toLinear(r)
	const lg = toLinear(g)
	const lb = toLinear(b)

	const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
	const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
	const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb

	const l_ = Math.cbrt(l)
	const m_ = Math.cbrt(m)
	const s_ = Math.cbrt(s)

	const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
	const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
	const bVal = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_

	const C = Math.sqrt(a * a + bVal * bVal)
	let h = (Math.atan2(bVal, a) * 180) / Math.PI
	if (h < 0) h += 360

	return `oklch(${L.toFixed(4)} ${C.toFixed(4)} ${h.toFixed(4)})`
}

export function useTelegramTheme() {
	const bgColor = useSignal(themeParams.backgroundColor)
	const textColor = useSignal(themeParams.textColor)
	const buttonColor = useSignal(themeParams.buttonColor)
	const buttonTextColor = useSignal(themeParams.buttonTextColor)
	const secondaryBgColor = useSignal(themeParams.secondaryBackgroundColor)
	const hintColor = useSignal(themeParams.hintColor)
	const accentTextColor = useSignal(themeParams.accentTextColor)
	const destructiveTextColor = useSignal(themeParams.destructiveTextColor)
	const sectionBgColor = useSignal(themeParams.sectionBackgroundColor)
	const subtitleTextColor = useSignal(themeParams.subtitleTextColor)

	useEffect(() => {
		const root = document.documentElement

		const mappings: Record<string, string | undefined> = {
			"--background": bgColor,
			"--foreground": textColor,
			"--card": sectionBgColor,
			"--card-foreground": textColor,
			"--popover": secondaryBgColor,
			"--popover-foreground": textColor,
			"--primary": buttonColor,
			"--primary-foreground": buttonTextColor,
			"--secondary": secondaryBgColor,
			"--secondary-foreground": textColor,
			"--muted": secondaryBgColor,
			"--muted-foreground": hintColor,
			"--accent": accentTextColor,
			"--accent-foreground": textColor,
			"--destructive": destructiveTextColor,
			"--border": secondaryBgColor,
			"--input": secondaryBgColor,
			"--ring": accentTextColor,
			"--sidebar": bgColor,
			"--sidebar-foreground": subtitleTextColor,
			"--sidebar-primary": buttonColor,
			"--sidebar-primary-foreground": buttonTextColor,
			"--sidebar-accent": secondaryBgColor,
			"--sidebar-accent-foreground": textColor,
			"--sidebar-border": secondaryBgColor,
		}

		Object.entries(mappings).forEach(([cssVar, color]) => {
			if (color) {
				root.style.setProperty(cssVar, hexToOklch(color))
			}
		})
	}, [
		bgColor,
		textColor,
		buttonColor,
		buttonTextColor,
		secondaryBgColor,
		hintColor,
		accentTextColor,
		destructiveTextColor,
		sectionBgColor,
		subtitleTextColor,
	])
}
