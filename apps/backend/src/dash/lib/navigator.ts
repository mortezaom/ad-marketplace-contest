import { useEffect, useState } from "hono/jsx/dom"

export type Page = "login" | "home" | "accounts"

function pathToPage(pathname: string): Page {
	const path = pathname.replace("/dash", "") || "/"

	if (path === "/login") {
		return "login"
	}
	if (path === "/accounts") {
		return "accounts"
	}
	return "home"
}

function pageToUrl(page: Page) {
	return page === "home" ? "/dash" : `/dash/${page}`
}

let page: Page = pathToPage(location.pathname)

const subs = new Set<(p: Page) => void>()

function emit() {
	for (const fn of subs) {
		fn(page)
	}
}

export function navigate(next: Page) {
	page = next
	history.pushState({}, "", pageToUrl(next))
	emit()
}

window.addEventListener("popstate", () => {
	page = pathToPage(location.pathname)
	emit()
})

export function usePage() {
	const [value, setValue] = useState<Page>(page)

	useEffect(() => {
		const fn = (p: Page) => setValue(p)
		subs.add(fn)
		return () => subs.delete(fn)
	}, [])

	return value
}
