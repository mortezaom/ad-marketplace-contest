interface NotyfOptions {
	duration?: number
	position?: { x: "left" | "center" | "right"; y: "top" | "bottom" }
	dismissible?: boolean
	ripple?: boolean
}

interface NotyfNotificationOptions {
	type?: "success" | "error" | string
	message: string
	duration?: number
	dismissible?: boolean
	icon?: { className: string; tagName?: string } | false
	background?: string
}

declare class Notyf {
	constructor(options?: NotyfOptions)
	success(message: string): void
	error(message: string): void
	open(options: NotyfNotificationOptions): void
	dismiss(notification: unknown): void
	dismissAll(): void
}

declare global {
	interface Window {
		Notyf: typeof Notyf
	}
}

export {}
