const notyf = new window.Notyf({
	duration: 100_000,
	position: { x: "right", y: "top" },
	dismissible: true,
	ripple: true,
})

export const toast = {
	success: (message: string) => notyf.success(message),
	error: (message: string) => notyf.error(message),
	info: (message: string) =>
		notyf.open({
			type: "info",
			message,
			background: "#3b82f6",
		}),
	warning: (message: string) =>
		notyf.open({
			type: "warning",
			message,
			background: "#f59e0b",
		}),
}
