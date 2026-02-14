"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { H3 } from "@/components/customized/typography"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createAdRequest } from "@/lib/http"
import { setBackButton } from "@/lib/tma"

export default function NewAdPage() {
	const router = useRouter()

	const [loading, setLoading] = useState(false)
	const [title, setTitle] = useState("")
	const [description, setDescription] = useState("")
	const [budget, setBudget] = useState("")
	const [minSubscribers, setMinSubscribers] = useState("")
	const [language, setLanguage] = useState("")
	const [deadline, setDeadline] = useState("")
	const [adFormat, setAdFormat] = useState<"post" | "story" | "forward">("post")
	const [contentGuidelines, setContentGuidelines] = useState("")

	const [errors, setErrors] = useState<Record<string, string>>({})

	useEffect(() => {
		setBackButton(() => router.back())
	}, [])

	const validate = () => {
		const newErrors: Record<string, string> = {}
		if (!title.trim()) {
			newErrors.title = "Required"
		}
		if (!budget || Number.parseInt(budget, 10) <= 0) {
			newErrors.budget = "Invalid"
		}
		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleSubmit = async () => {
		if (!validate()) {
			return
		}

		setLoading(true)
		const res = await createAdRequest({
			title: title.trim(),
			description: description.trim() || undefined,
			budget: Number.parseInt(budget, 10),
			minSubscribers: minSubscribers ? Number.parseInt(minSubscribers, 10) : undefined,
			language: language.trim() || undefined,
			deadline: deadline || undefined,
			adFormat,
			contentGuidelines: contentGuidelines.trim() || undefined,
		})
		setLoading(false)

		if (res.ok) {
			toast.success("Ad request created!")
			router.replace("/")
		} else {
			toast.error(res.message || "Failed")
		}
	}

	return (
		<main className="flex min-h-screen w-full flex-col gap-3 overflow-y-auto px-4 py-2">
			<H3>Create Ad</H3>

			{/* Title */}
			<Field>
				<FieldLabel>Title *</FieldLabel>
				<Input
					onChange={(e) => setTitle(e.target.value)}
					placeholder="Campaign name"
					value={title}
				/>
				{errors.title && <FieldError>{errors.title}</FieldError>}
			</Field>

			{/* Description */}
			<Field>
				<FieldLabel>Description</FieldLabel>
				<Textarea
					onChange={(e) => setDescription(e.target.value)}
					placeholder="What is your campaign about?"
					rows={2}
					value={description}
				/>
			</Field>

			{/* Budget */}
			<Field>
				<FieldLabel>Budget (TON) *</FieldLabel>
				<div className="flex items-center gap-2">
					<span className="text-lg">TON</span>
					<Input
						className="flex-1"
						onChange={(e) => setBudget(e.target.value)}
						placeholder="100"
						type="number"
						value={budget}
					/>
				</div>
				{errors.budget && <FieldError>{errors.budget}</FieldError>}
			</Field>

			{/* Format */}
			<Field>
				<FieldLabel>Format</FieldLabel>
				<Select
					onValueChange={(v) => setAdFormat(v as "post" | "story" | "forward")}
					value={adFormat}
				>
					<SelectTrigger className="h-10">
						<SelectValue placeholder="Story" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="post">Post</SelectItem>
						<SelectItem value="story">Story (Soon)</SelectItem>
						<SelectItem value="forward">Forward (Soon)</SelectItem>
					</SelectContent>
				</Select>
			</Field>

			{/* Min Subscribers */}
			<Field>
				<FieldLabel>Min. Subscribers</FieldLabel>
				<Input
					onChange={(e) => setMinSubscribers(e.target.value)}
					placeholder="0"
					type="number"
					value={minSubscribers}
				/>
			</Field>

			{/* Language */}
			<Field>
				<FieldLabel>Language</FieldLabel>
				<Input
					onChange={(e) => setLanguage(e.target.value)}
					placeholder="English, Persian..."
					value={language}
				/>
			</Field>

			{/* Deadline */}
			<Field>
				<FieldLabel>Deadline</FieldLabel>
				<Input onChange={(e) => setDeadline(e.target.value)} type="date" value={deadline} />
			</Field>

			{/* Content Guidelines */}
			<Field>
				<FieldLabel>Content Guidelines</FieldLabel>
				<Textarea
					onChange={(e) => setContentGuidelines(e.target.value)}
					placeholder="What should the post contain?"
					rows={2}
					value={contentGuidelines}
				/>
			</Field>

			<Button className="mt-2 w-full" disabled={loading} onClick={handleSubmit}>
				{loading ? "Creating..." : "Create Ad"}
			</Button>
		</main>
	)
}
