/** biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: ignore */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: ignore */
import type { Child } from "hono/jsx"
import { useEffect, useRef } from "hono/jsx/dom"

interface Props {
	open: boolean
	onClose: () => void
	title?: string
	children: Child
	size?: "sm" | "md" | "lg"
}

const sizes = {
	sm: "max-w-sm",
	md: "max-w-md",
	lg: "max-w-lg",
}

export function Dialog({ open, onClose, title, children, size = "md" }: Props) {
	const ref = useRef<HTMLDialogElement>(null)

	useEffect(() => {
		const d = ref.current
		if (!d) {
			return
		}
		if (open) {
			d.showModal()
		} else {
			d.close()
		}
	}, [open])

	useEffect(() => {
		const d = ref.current
		if (!d) {
			return
		}
		d.addEventListener("close", onClose)
		return () => d.removeEventListener("close", onClose)
	}, [onClose])

	return (
		<>
			<style>{`
        dialog.modal::backdrop {
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(2px);
        }
        .dialog-pop {
          animation: dialog-pop 160ms ease-out;
        }
        @keyframes dialog-pop {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
			<dialog class="modal" ref={ref}>
				<div class={`modal-box relative ${sizes[size]} dialog-pop`}>
					<button
						class="btn btn-sm btn-circle btn-ghost absolute top-3 right-3"
						onClick={onClose}
						type="button"
					>
						✕
					</button>
					{title && <h3 class="mb-4 pr-10 font-bold text-lg">{title}</h3>}
					{children}
				</div>
			</dialog>
		</>
	)
}
