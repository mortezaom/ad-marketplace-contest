import type { Child } from "hono/jsx"
import { navigate, type Page } from "../lib/navigator"

interface Props {
	to: Page
	class?: string
	children: Child
}

function pageToHref(to: Page) {
	return to === "home" ? "/dash" : `/dash/${to}`
}

export function Link(props: Props) {
	const href = pageToHref(props.to)

	return (
		<a
			class={props.class}
			href={href}
			onClick={(e) => {
				if (
					e.defaultPrevented ||
					(e as MouseEvent).button !== 0 ||
					(e as MouseEvent).metaKey ||
					(e as MouseEvent).ctrlKey ||
					(e as MouseEvent).shiftKey ||
					(e as MouseEvent).altKey
				) {
					return
				}

				e.preventDefault()
				navigate(props.to)
			}}
		>
			{props.children}
		</a>
	)
}
