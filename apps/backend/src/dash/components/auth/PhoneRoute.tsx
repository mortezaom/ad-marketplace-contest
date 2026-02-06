import { OtpInput } from "./OtpInput"

type Step = "phone" | "otp"

interface Props {
	step: Step
	loading: boolean
	error: string
	code: string
	phone: string
	otp: string
	length: number
	onCode: (v: string) => void
	onPhone: (v: string) => void
	onOtp: (v: string) => void
	onBack: () => void
	onSend: () => void
	onVerify: () => void
	onResend: () => void
}

export function PhoneRoute(props: Props) {
	return (
		<div>
			{props.error && (
				<div class="alert alert-error mb-4 py-2">
					<span class="text-sm">{props.error}</span>
				</div>
			)}

			{props.step === "phone" && (
				<>
					<p class="mb-4 text-base-content/70 text-sm">We'll send you a 6-digit code.</p>

					<div class="flex items-center gap-2">
						{/* Country Code Input */}
						<div class="relative w-24">
							<span class="absolute top-1/2 left-3 z-20 -translate-y-1/2 select-none text-base-content/50">
								+
							</span>
							<input
								class="input input-bordered w-full pl-7 text-center font-mono"
								inputMode="numeric"
								maxLength={4}
								onInput={(e) => {
									const v = (e.target as HTMLInputElement).value.replace(/[^0-9]/g, "")
									props.onCode(v)
								}}
								placeholder="1"
								type="text"
								value={props.code}
							/>
						</div>

						{/* Phone Number Input */}
						<input
							class="input input-bordered flex-1 font-mono"
							inputMode="numeric"
							onInput={(e) => {
								const v = (e.target as HTMLInputElement).value.replace(/[^0-9]/g, "")
								props.onPhone(v)
							}}
							onKeyDown={(e) => {
								if ((e as KeyboardEvent).key === "Enter") {
									props.onSend()
								}
							}}
							placeholder="Phone Number"
							type="tel"
							value={props.phone}
						/>
					</div>

					<div class="mt-6 flex justify-end gap-2">
						<button class="btn btn-ghost" onClick={props.onBack} type="button">
							Back
						</button>
						<button
							class="btn btn-primary"
							disabled={props.loading || props.phone.length < 5 || !props.code}
							onClick={props.onSend}
							type="button"
						>
							{props.loading && <span class="loading loading-spinner loading-sm" />}
							Send code
						</button>
					</div>
				</>
			)}

			{props.step === "otp" && (
				<>
					<p class="mb-4 text-center text-base-content/70 text-sm">
						Code sent to{" "}
						<span class="font-medium font-mono">
							+{props.code} {props.phone}
						</span>
					</p>

					<OtpInput length={props.length} onChange={props.onOtp} value={props.otp} />

					<div class="mt-6 flex justify-center gap-2">
						<button class="btn btn-ghost" onClick={props.onBack} type="button">
							Back
						</button>
						<button
							class="btn btn-primary"
							disabled={props.loading || props.otp.length !== props.length}
							onClick={props.onVerify}
							type="button"
						>
							{props.loading && <span class="loading loading-spinner loading-sm" />}
							Verify
						</button>
					</div>

					<div class="mt-4 text-center">
						<button class="link link-primary text-sm" onClick={props.onResend} type="button">
							Resend code
						</button>
					</div>
				</>
			)}
		</div>
	)
}
