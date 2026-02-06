import { Link } from "../components/Link"

export function HomePage() {
	return (
		<div class="grid md:grid-cols-3">
			<div class="stat bg-base-100 shadow">
				<div class="stat-title">Service Accounts</div>
				<div class="stat-value">8</div>
				<div class="flex justify-end">
					<Link class="btn btn-soft btn-info" to="accounts">
						Show All <i class="iconoir-arrow-up-right" />
					</Link>
				</div>
			</div>

			<div class="stat bg-base-100 shadow">
				<div class="stat-title">Total Channels</div>
				<div class="stat-value text-primary">89</div>
			</div>

			<div class="stat bg-base-100 shadow">
				<div class="stat-title">Total Wallets</div>
				<div class="stat-value text-secondary-content">104</div>
			</div>
		</div>
	)
}
