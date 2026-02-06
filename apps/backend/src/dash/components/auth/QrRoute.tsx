interface Props {
	loading: boolean
	onBack: () => void
	onConfirm: () => void
}

export function QrRoute({ loading, onBack, onConfirm }: Props) {
	console.log(loading, onBack, onConfirm)
	return (
		<div class="text-center">
			<div class="mb-3 inline-block rounded-lg bg-white p-3">
				<div class="flex h-48 w-48 items-center justify-center rounded bg-base-200">
					<span class="text-base-content/60 text-sm">
						You can scan a provided QR code with your Telegram Client on your phone to login to the
						account!
					</span>
				</div>
			</div>
			<div class="flex justify-center gap-2">
				<button class="btn btn-ghost" onClick={onBack} type="button">
					Back
				</button>
				{/* <button class="btn btn-primary" disabled={loading} onClick={onConfirm} type="button">
					{loading && <span class="loading loading-spinner loading-sm" />}I scanned it
				</button> */}
			</div>
		</div>
	)
}
