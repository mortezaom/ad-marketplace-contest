interface SelectProps {
	onQr: () => void
	onPhone: () => void
}

export function StepSelect({ onQr, onPhone }: SelectProps) {
	return (
		<div class="py-2">
			<p class="mb-4 text-base-content/70">Choose a method to continue.</p>
			<div class="flex flex-col gap-3">
				<button class="btn btn-outline" onClick={onQr} type="button">
					Scan QR Code
				</button>
				<button class="btn btn-outline" onClick={onPhone} type="button">
					Phone Number
				</button>
			</div>
		</div>
	)
}

interface ResultProps {
	success: boolean
	message: string
	onDone: () => void
	onRetry?: () => void
}

export function StepResult({ success, message, onDone, onRetry }: ResultProps) {
	return (
		<div class="py-3 text-center">
			<div class="mb-2 text-4xl">{success ? "✅" : "❌"}</div>
			<div class="font-bold text-lg">{success ? "Verified" : "Failed"}</div>
			<p class="mt-1 mb-5 text-base-content/70 text-sm">{message}</p>
			<div class="flex justify-center gap-2">
				<button class="btn btn-ghost" onClick={onDone} type="button">
					Close
				</button>
				{!success && onRetry && (
					<button class="btn btn-primary" onClick={onRetry} type="button">
						Try again
					</button>
				)}
			</div>
		</div>
	)
}
