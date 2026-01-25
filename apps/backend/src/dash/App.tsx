import { useState } from "hono/jsx/dom"
import { Home } from "./pages/Home"
import { Login } from "./pages/Login"
import { Users } from "./pages/Users"

type Page = "login" | "home" | "users"

export function App() {
	const [page, setPage] = useState<Page>(() => {
		const path = location.pathname.replace("/dash", "") || "/"
		if (path === "/login") {
			return "login"
		}
		if (path === "/users") {
			return "users"
		}
		return "home"
	})

	const navigate = (p: Page) => {
		const url = p === "home" ? "/dash" : `/dash/${p}`
		history.pushState({}, "", url)
		setPage(p)
	}

	if (page === "login") {
		return <Login onSuccess={() => navigate("home")} />
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
								class={page === "users" ? "active" : ""}
								onClick={() => navigate("users")}
								type="button"
							>
								Users
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
				{page === "home" && <Home />}
				{page === "users" && <Users />}
			</main>
		</div>
	)
}
