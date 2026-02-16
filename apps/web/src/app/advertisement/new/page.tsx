"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { H4 } from "@/components/customized/typography"
import { DatePickerComponent } from "@/components/date-picker"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { request } from "@/lib/http"
import { setBackButton } from "@/lib/tma"

const languageOptions = ["English", "Russian", "Persian", "Spanish", "Arabic"]

export default function NewAdPage() {
	const router = useRouter()

	const [loading, setLoading] = useState(false)
	const [title, setTitle] = useState("")
	const [description, setDescription] = useState("")
	const [budget, setBudget] = useState("")
	const [minSubscribers, setMinSubscribers] = useState("")
	const [language, setLanguage] = useState("None")
	const [deadline, setDeadline] = useState<Date | undefined>()
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
		if (!budget || Number.parseFloat(budget) <= 0) {
			newErrors.budget = "Invalid"
		}

		if (!deadline) {
			newErrors.deadline = "Required"
		}
		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleSubmit = async () => {
		if (!validate()) {
			return
		}

		setLoading(true)
		const res = await request("ads", {
			method: "post",
			json: {
				title: title.trim(),
				description: description.trim() || undefined,
				budget: Number.parseFloat(budget),
				minSubscribers: minSubscribers ? Number.parseInt(minSubscribers, 10) : undefined,
				language: language.trim() || undefined,
				deadline: deadline?.toISOString() || undefined,
				adFormat,
				contentGuidelines: contentGuidelines.trim() || undefined,
			},
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
		<main className="flex min-h-screen w-full flex-col gap-5 overflow-y-auto px-4 py-2">
			<H4 className="mb-3">Create Ad</H4>

			<Field>
				<FieldLabel>Title *</FieldLabel>
				<Input
					className="h-10 text-sm"
					onChange={(e) => setTitle(e.target.value)}
					placeholder="Campaign name"
					value={title}
				/>
				{errors.title && <FieldError>{errors.title}</FieldError>}
			</Field>

			<Field>
				<FieldLabel>Description</FieldLabel>
				<Textarea
					className="min-h-20 text-sm"
					onChange={(e) => setDescription(e.target.value)}
					placeholder="What is your campaign about?"
					rows={2}
					value={description}
				/>
			</Field>

			<Field>
				<FieldLabel>Budget (TON) *</FieldLabel>
				<InputGroup className="h-10 flex-1 text-sm">
					<InputGroupInput
						className="text-sm"
						min={0}
						onChange={(e) => setBudget(e.target.value)}
						placeholder="100"
						type="number"
						value={budget}
					/>
					<InputGroupAddon align="inline-end">TON</InputGroupAddon>
				</InputGroup>
				{errors.budget && <FieldError>{errors.budget}</FieldError>}
			</Field>

			<Field>
				<FieldLabel>Format</FieldLabel>
				<Select
					onValueChange={(v) => setAdFormat(v as "post" | "story" | "forward")}
					value={adFormat}
				>
					<SelectTrigger className="h-10 flex-1">
						<SelectValue placeholder="Story" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem className="py-2" value="post">
							Post
						</SelectItem>
						<SelectItem className="py-2" disabled value="story">
							Story (Soon)
						</SelectItem>
						<SelectItem disabled value="forward">
							Forward (Soon)
						</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<Field>
				<FieldLabel>Min. Subscribers</FieldLabel>
				<Input
					className="h-9 text-sm"
					onChange={(e) => setMinSubscribers(e.target.value)}
					placeholder="0"
					type="number"
					value={minSubscribers}
				/>
			</Field>

			<Field>
				<FieldLabel>Audience Language</FieldLabel>
				<Select onValueChange={(v) => setLanguage(v)} value={language}>
					<SelectTrigger className="h-10 flex-1 text-sm">
						<SelectValue placeholder="Select Prefered Language" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem className="py-2" value="None">
							None
						</SelectItem>
						{languageOptions.map((l) => {
							return (
								<SelectItem className="py-2" key={`lang-${l}`} value={l}>
									{l}
								</SelectItem>
							)
						})}
					</SelectContent>
				</Select>
			</Field>

			<Field>
				<FieldLabel>Post Date</FieldLabel>
				<DatePickerComponent
					className="h-10 text-sm"
					onChange={(e) => setDeadline(e)}
					value={deadline}
					withTime
				/>

				{errors.deadline && <FieldError>{errors.deadline}</FieldError>}
			</Field>

			<Field>
				<FieldLabel>Content Guidelines</FieldLabel>
				<Textarea
					className="min-h-20 flex-1 text-sm"
					onChange={(e) => setContentGuidelines(e.target.value)}
					placeholder="What should the post contain?"
					rows={2}
					value={contentGuidelines}
				/>
			</Field>

			<Button className="mt-2 w-full" disabled={loading} onClick={handleSubmit}>
				Submit Promotion
				{loading && <Spinner data-icon="inline-start" />}
			</Button>
		</main>
	)
}
