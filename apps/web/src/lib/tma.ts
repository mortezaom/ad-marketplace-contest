import { backButton, mainButton } from "@telegram-apps/sdk-react"

export const setMainButton = (type: "channel" | "ads", onClick: () => void) => {
	setTimeout(() => {
		if (mainButton.isMounted()) {
			mainButton.setParams({
				text: type === "ads" ? "Create Advertisement" : "Add Channel",
				isVisible: true,
			})

			mainButton.onClick(onClick)
		}
	}, 0)
}

export const hideMainButton = () => {
	setTimeout(() => {
		if (mainButton.isMounted()) {
			mainButton.setParams({
				isVisible: false,
			})
		}
	}, 0)
}

export const setBackButton = (onClick: () => void) => {
	setTimeout(() => {
		if (!backButton.isMounted()) {
			backButton.mount()
		}
		backButton.show()
		backButton.onClick(onClick)
	}, 0)
}

export const hideBackButton = () => {
	setTimeout(() => {
		if (backButton.isMounted()) {
			backButton.hide()
		}
	}, 0)
}

export const usernameRegex = /^[a-zA-Z0-9_]{5,32}$/
