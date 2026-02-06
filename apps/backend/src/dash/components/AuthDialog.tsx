import { useState } from "hono/jsx/dom"
import { request } from "../lib/http"
import { PhoneRoute } from "./auth/PhoneRoute"
import { QrRoute } from "./auth/QrRoute"
import { StepResult, StepSelect } from "./auth/SharedSteps"
import { Dialog } from "./Dialog"

export type Method = "qr" | "phone"

interface Props {
	open: boolean
	onClose: () => void
}

interface SubmitPhoneData {
	flowId: string
	step: string
	expiresAt: Date
	length: number
}

type Step = "select" | "qr" | "phone" | "otp" | "result"

export function AuthDialog({ open, onClose }: Props) {
	const [step, setStep] = useState<Step>("select")

	// Phone state
	const [code, setCode] = useState("1")
	const [phone, setPhone] = useState("")
	const [otp, setOtp] = useState("")

	const [submitData, setSubmitData] = useState<SubmitPhoneData | null>(null)

	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")
	const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

	const reset = () => {
		setStep("select")
		setCode("1")
		setPhone("")
		setOtp("")
		setLoading(false)
		setError("")
		setResult(null)
	}

	const close = () => {
		reset()
		onClose()
	}

	const sendOtp = async () => {
		if (phone.length < 5) {
			return setError("Enter a valid phone number")
		}
		setError("")
		setLoading(true)
		const response = await request<SubmitPhoneData>("/api/saccounts/flows", {
			method: "POST",
			json: {
				phone: `+${code}${phone}`,
			},
		})

		if (response.ok) {
			setSubmitData(response.data)
			setStep("otp")
		} else {
			setError(response.message || "Failed to send OTP")
		}
		setLoading(false)
	}

	const verifyOtp = async () => {
		if (otp.length !== submitData?.length || !submitData?.flowId) {
			return setError("Enter 6 digits")
		}
		setError("")
		setLoading(true)

		const response = await request(`/api/saccounts/flows/${submitData.flowId}/code`, {
			method: "POST",
			json: {
				code: otp,
			},
		})

		if (!response.ok) {
			setError(response.message || "Failed to verify OTP")
			setLoading(false)
			return
		}

		setLoading(false)
		setResult({ success: true, message: "Account added successfully!" })
		setStep("result")
	}

	const confirmQr = async () => {
		// TODO: to be implemented
	}

	return (
		<Dialog onClose={close} open={open} size="sm" title="Verification">
			{step === "select" && (
				<StepSelect
					onPhone={() => {
						setStep("phone")
					}}
					onQr={() => {
						setStep("qr")
					}}
				/>
			)}

			{step === "qr" && (
				<QrRoute
					loading={loading}
					onBack={() => {
						setError("")
						setStep("select")
					}}
					onConfirm={confirmQr}
				/>
			)}

			{(step === "phone" || step === "otp") && (
				<PhoneRoute
					code={code}
					error={error}
					length={submitData?.length ?? 6}
					loading={loading}
					onBack={() => {
						setError("")
						setLoading(false)
						if (step === "otp") {
							setStep("phone")
						} else {
							setStep("select")
						}
					}}
					onCode={setCode}
					onOtp={setOtp}
					onPhone={setPhone}
					onResend={sendOtp}
					onSend={sendOtp}
					onVerify={verifyOtp}
					otp={otp}
					phone={phone}
					step={step}
				/>
			)}

			{step === "result" && result && (
				<StepResult
					message={result.message}
					onDone={close}
					onRetry={
						result.success
							? undefined
							: () => {
									setOtp("")
									setError("")
									setResult(null)
									setStep("otp")
								}
					}
					success={result.success}
				/>
			)}
		</Dialog>
	)
}
