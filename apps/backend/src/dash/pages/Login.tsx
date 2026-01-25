import { useState } from "hono/jsx/dom"
import { toast } from "../lib/toast"

export function Login({ onSuccess }: { onSuccess: () => void }) {
	const [user, setUser] = useState("")
	const [pass, setPass] = useState("")
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)

	const submit = async (e: Event) => {
		e.preventDefault()
		setLoading(true)
		setError("")

		const res = await fetch("/dash/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ user, pass }),
		})

		setLoading(false)
		if (res.ok) {
			onSuccess()
		} else {
			toast.error("Invalid credentials")
			setError("Invalid credentials")
		}
	}

	return (
		<div class="background-pattern relative flex min-h-screen items-center justify-center">
			<div class="card w-96 bg-base-200 shadow-xl">
				<div class="card-body">
					<h2 class="card-title justify-center text-2xl">Dashboard Login</h2>

					{error && (
						<div class="alert alert-error">
							<span>{error}</span>
						</div>
					)}

					<form onSubmit={submit}>
						<div class="form-control">
							<label class="label">
								<span class="label-text">Username</span>
							</label>
							<input
								class="input input-bordered"
								onInput={(e) => setUser((e.target as HTMLInputElement).value)}
								type="text"
								value={user}
							/>
						</div>

						<div class="form-control mt-2">
							<label class="label">
								<span class="label-text">Password</span>
							</label>
							<input
								class="input input-bordered"
								onInput={(e) => setPass((e.target as HTMLInputElement).value)}
								type="password"
								value={pass}
							/>
						</div>

						<div class="form-control mt-6">
							<button class="btn btn-primary" disabled={loading} type="submit">
								{loading && <span class="loading loading-spinner loading-sm" />}
								Login
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}
