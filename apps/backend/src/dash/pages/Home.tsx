export function Home() {
	return (
		<div class="grid gap-6 md:grid-cols-3">
			<div class="stat rounded-box bg-base-100 shadow">
				<div class="stat-title">Total Users</div>
				<div class="stat-value">1,234</div>
				<div class="stat-desc">↗︎ 12% more than last month</div>
			</div>

			<div class="stat rounded-box bg-base-100 shadow">
				<div class="stat-title">Active Now</div>
				<div class="stat-value text-primary">89</div>
				<div class="stat-desc">Online users</div>
			</div>

			<div class="stat rounded-box bg-base-100 shadow">
				<div class="stat-title">Revenue</div>
				<div class="stat-value text-secondary">$12,500</div>
				<div class="stat-desc">↘︎ 3% less than last month</div>
			</div>
		</div>
	)
}
