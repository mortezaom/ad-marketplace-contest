import { useState } from "hono/jsx/dom"
import { closeModal, Modal, openModal } from "../components/Modal"

interface User {
	id: number
	name: string
	email: string
	role: string
}

export function Users() {
	const [users, setUsers] = useState<User[]>([
		{ id: 1, name: "John Doe", email: "john@example.com", role: "Admin" },
		{ id: 2, name: "Jane Smith", email: "jane@example.com", role: "User" },
	])

	const [form, setForm] = useState({ name: "", email: "", role: "User" })
	const [editId, setEditId] = useState<number | null>(null)

	const resetForm = () => {
		setForm({ name: "", email: "", role: "User" })
		setEditId(null)
	}

	const handleSave = () => {
		if (editId) {
			setUsers(users.map((u) => (u.id === editId ? { ...u, ...form } : u)))
		} else {
			setUsers([...users, { id: Date.now(), ...form }])
		}
		closeModal("user-modal")
		resetForm()
	}

	const handleEdit = (user: User) => {
		setForm({ name: user.name, email: user.email, role: user.role })
		setEditId(user.id)
		openModal("user-modal")
	}

	const handleDelete = (id: number) => {
		setUsers(users.filter((u) => u.id !== id))
	}

	return (
		<div>
			<div class="mb-4 flex items-center justify-between">
				<h1 class="font-bold text-2xl">Users</h1>
				<button
					class="btn btn-primary"
					onClick={() => {
						resetForm()
						openModal("user-modal")
					}}
					type="button"
				>
					+ Add User
				</button>
			</div>

			<div class="overflow-x-auto rounded-box bg-base-100 shadow">
				<table class="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Email</th>
							<th>Role</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{users.map((user) => (
							<tr key={user.id}>
								<td>{user.name}</td>
								<td>{user.email}</td>
								<td>
									<span class="badge badge-ghost">{user.role}</span>
								</td>
								<td class="flex gap-2">
									<button
										class="btn btn-sm btn-info"
										onClick={() => handleEdit(user)}
										type="button"
									>
										Edit
									</button>
									<button
										class="btn btn-sm btn-error"
										onClick={() => handleDelete(user.id)}
										type="button"
									>
										Delete
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<Modal id="user-modal" title={editId ? "Edit User" : "Add User"}>
				<div class="form-control">
					<label class="label">
						<span class="label-text">Name</span>
					</label>
					<input
						class="input input-bordered"
						onInput={(e) => setForm({ ...form, name: (e.target as HTMLInputElement).value })}
						type="text"
						value={form.name}
					/>
				</div>

				<div class="form-control mt-2">
					<label class="label">
						<span class="label-text">Email</span>
					</label>
					<input
						class="input input-bordered"
						onInput={(e) => setForm({ ...form, email: (e.target as HTMLInputElement).value })}
						type="email"
						value={form.email}
					/>
				</div>

				<div class="form-control mt-2">
					<label class="label">
						<span class="label-text">Role</span>
					</label>
					<select
						class="select select-bordered"
						onChange={(e) => setForm({ ...form, role: (e.target as HTMLSelectElement).value })}
						value={form.role}
					>
						<option>User</option>
						<option>Admin</option>
						<option>Moderator</option>
					</select>
				</div>

				<div class="modal-action">
					<button class="btn" onClick={() => closeModal("user-modal")} type="button">
						Cancel
					</button>
					<button class="btn btn-primary" onClick={handleSave} type="button">
						Save
					</button>
				</div>
			</Modal>
		</div>
	)
}
