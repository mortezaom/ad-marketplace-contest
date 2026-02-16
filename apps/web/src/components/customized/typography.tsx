import { cn } from "@/lib/utils"

export function H1({
	children,
	className,
}: Readonly<{
	children: React.ReactNode
	className?: string
}>) {
	return (
		<h1
			className={cn(
				"scroll-m-20 text-balance text-center font-extrabold text-4xl tracking-tight",
				className
			)}
		>
			{children}
		</h1>
	)
}

export function H2({
	children,
	className,
}: Readonly<{
	children: React.ReactNode
	className?: string
}>) {
	return (
		<h1
			className={cn(
				"scroll-m-20 border-b pb-2 font-semibold text-3xl tracking-tight first:mt-0",
				className
			)}
		>
			{children}
		</h1>
	)
}

export function H3({
	children,
	className,
}: Readonly<{
	children: React.ReactNode
	className?: string
}>) {
	return (
		<h1 className={cn("scroll-m-20 font-semibold text-[1.3rem] tracking-tight", className)}>
			{children}
		</h1>
	)
}

export function H4({
	children,
	className,
}: Readonly<{
	children: React.ReactNode
	className?: string
}>) {
	return (
		<h1 className={cn("scroll-m-20 font-semibold text-xl tracking-tight", className)}>
			{children}
		</h1>
	)
}

export function H5({
	children,
	className,
}: Readonly<{
	children: React.ReactNode
	className?: string
}>) {
	return (
		<h1 className={cn("scroll-m-20 font-semibold text-lg tracking-tight", className)}>
			{children}
		</h1>
	)
}

export function P({
	children,
	className,
}: Readonly<{
	children: React.ReactNode
	className?: string
}>) {
	return <h1 className={cn("not-first:mt-1 leading-5", className)}>{children}</h1>
}
