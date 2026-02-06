import { navigate, usePage } from "./lib/navigator"
import { AccountsPage } from "./pages/Accounts"
import { HomePage } from "./pages/Home"
import { LoginPage } from "./pages/Login"

export function App() {
	const page = usePage()

	if (page === "login") {
		return <LoginPage onSuccess={() => navigate("home")} />
	}

	return (
		<div class="min-h-screen bg-base-200">
			<div class="navbar bg-base-100 shadow-lg">
				<div class="flex-1">
					<span class="px-4 font-bold text-xl">Dashboard</span>
				</div>
				<div class="flex-none">
					<ul class="menu menu-horizontal px-1">
						<li>
							<button
								class={page === "home" ? "active" : ""}
								onClick={() => navigate("home")}
								type="button"
							>
								Home
							</button>
						</li>
						<li>
							<button
								class={page === "accounts" ? "active" : ""}
								onClick={() => navigate("accounts")}
								type="button"
							>
								Service Accounts
							</button>
						</li>
						<li>
							<a class="text-error" href="/dash/auth/logout">
								Logout
							</a>
						</li>
					</ul>
				</div>
			</div>

			<main class="p-6">
				{page === "home" && <HomePage />}
				{page === "accounts" && <AccountsPage />}
			</main>
		</div>
	)
}
