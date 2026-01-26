import type { Child } from "hono/jsx"

interface Props {
	id: string
	title: string
	children: Child
}

export function Modal({ id, title, children }: Props) {
	return (
		<dialog class="modal" id={id}>
			<div class="modal-box shadow-sm">
				<form method="dialog">
					<button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2" type="button">
						✕
					</button>
				</form>
				<h3 class="font-bold text-lg">{title}</h3>
				<div class="py-4">{children}</div>
			</div>
			<form class="modal-backdrop" method="dialog">
				<button type="button">close</button>
			</form>
		</dialog>
	)
}

export function openModal(id: string) {
	;(document.getElementById(id) as HTMLDialogElement)?.showModal()
}

export function closeModal(id: string) {
	;(document.getElementById(id) as HTMLDialogElement)?.close()
}
