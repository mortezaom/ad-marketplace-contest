import { motion } from "motion/react"

export const CustomConfirm = ({ showTick }: { showTick: boolean }) => {
	return (
		<div style={{ display: "grid", gap: 12 }}>
			<div
				style={{
					width: 128,
					height: 128,
					borderRadius: 16,
					display: "grid",
					placeItems: "center",
				}}
			>
				<motion.svg
					aria-hidden="true"
					height="100"
					initial={false}
					viewBox="0 0 128 128"
					width="100"
				>
					<motion.circle
						animate={showTick ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
						cx="64"
						cy="64"
						fill="transparent"
						initial={{ pathLength: 0, opacity: 0 }}
						r="50"
						stroke="#22c55e"
						strokeLinecap="round"
						strokeWidth="4"
						style={{ willChange: "transform" }}
						transition={{ duration: 0.35, ease: "easeOut" }}
					/>

					<motion.path
						animate={showTick ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
						d="M42 67 L57 83 L88 49"
						fill="transparent"
						initial={{ pathLength: 0, opacity: 0 }}
						stroke="#22c55e"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="5"
						style={{ willChange: "transform" }}
						transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
					/>
				</motion.svg>
			</div>
		</div>
	)
}
