/** biome-ignore-all lint/suspicious/noArrayIndexKey: ignore */
import { useRef } from "hono/jsx/dom"

interface Props {
	value: string
	onChange: (v: string) => void
	length: number
}

export function OtpInput({ value, onChange, length }: Props) {
	const refs = useRef<HTMLInputElement[]>([])

	return (
		<div class="flex justify-center gap-2">
			{Array.from({ length }).map((_, i) => (
				<input
					class="input input-bordered w-11 text-center text-lg"
					inputMode="numeric"
					key={i}
					maxLength={1}
					onInput={(e) => {
						const v = (e.target as HTMLInputElement).value.replace(/[^0-9]/g, "")
						const arr = value.split("")
						while (arr.length < length) {
							arr.push("")
						}
						arr[i] = v[0]
						onChange(arr.join("").slice(0, length))
						if (refs.current && v[0]) {
							refs.current[i + 1]?.focus()
						}
					}}
					onKeyDown={(e) => {
						const ke = e as unknown as KeyboardEvent
						if (refs.current && ke.key === "Backspace" && !value[i] && i > 0) {
							refs.current[i - 1]?.focus()
						}
					}}
					onPaste={(e) => {
						;(e as unknown as ClipboardEvent).preventDefault()
						const t =
							(e as unknown as ClipboardEvent).clipboardData
								?.getData("text")
								.replace(/[^0-9]/g, "") || ""
						onChange(t.slice(0, length))
					}}
					ref={(el: HTMLInputElement) => {
						if (el && refs.current) {
							refs.current[i] = el
						}
					}}
					value={value[i] || ""}
				/>
			))}
		</div>
	)
}
