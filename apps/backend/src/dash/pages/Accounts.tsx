import { useEffect, useState } from "hono/jsx/dom"
import type { AccountType } from "@/db/schema"
import { AuthDialog } from "../components/AuthDialog"
import { request } from "../lib/http"
import { toast } from "../lib/toast"

export function AccountsPage() {
	const [accounts, setAccounts] = useState<AccountType[]>([])

	const [isAuthOpen, setIsAuthOpen] = useState(false)

	useEffect(() => {
		getAccountsList()
	}, [])

	const getAccountsList = async () => {
		const response = await request<AccountType[]>("/api/saccounts/get-list")
		if (response.ok) {
			setAccounts(response.data)
		} else {
			toast.error(response.message)
		}
	}

	return (
		<div>
			<div class="mb-4 flex items-center justify-between">
				<h1 class="font-bold text-2xl">Accounts</h1>
				<button
					class="btn btn-primary"
					onClick={() => {
						setIsAuthOpen(true)
					}}
					type="button"
				>
					+ Add Account
				</button>
			</div>

			<div class="overflow-x-auto rounded-box bg-base-100 shadow">
				<table class="table">
					<thead>
						<tr>
							<th>Label</th>
							<th>Telegram ID</th>
							<th>Telegram Name</th>
							<th>Status</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{accounts.map((account) => (
							<tr key={account.tgUserId}>
								<td>{account.label}</td>
								<td>{account.tgUserId}</td>
								<td>
									{account.tgFirstName} {account.tgLastName}
								</td>
								<td>
									<span
										class={`badge badge-${account.status === "active" ? "success" : "error"}`}
									>
										{account.status}
									</span>
								</td>
								<td class="flex gap-2">
									{/* TODO: To Be Implemeted */}
									<button class="btn btn-sm btn-error" type="button">
										Terminate
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<AuthDialog onClose={() => setIsAuthOpen(false)} open={isAuthOpen} />
		</div>
	)
}
