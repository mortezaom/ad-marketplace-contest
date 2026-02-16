"use client"

import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerProps {
	value: Date | undefined
	onChange: (date: Date | undefined) => void
	className?: string
	withTime?: boolean
	defaultTime?: string
}

export function DatePickerComponent({
	value,
	onChange,
	className,
	withTime = false,
	defaultTime = "00:00:00",
}: DatePickerProps) {
	const handleDateSelect = (selected: Date | undefined) => {
		if (!selected) {
			onChange(undefined)
			return
		}

		if (value) {
			selected.setHours(value.getHours())
			selected.setMinutes(value.getMinutes())
			selected.setSeconds(value.getSeconds())
		} else {
			const [h, m, s] = defaultTime.split(":").map(Number)
			selected.setHours(h ?? 0)
			selected.setMinutes(m ?? 0)
			selected.setSeconds(s ?? 0)
		}

		onChange(selected)
	}

	const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const timeValue = e.target.value
		if (!timeValue) {
			return
		}

		const [hours, minutes, seconds] = timeValue.split(":").map(Number)
		const newDate = value ? new Date(value) : new Date()

		newDate.setHours(hours ?? 0)
		newDate.setMinutes(minutes ?? 0)
		newDate.setSeconds(seconds ?? 0)

		onChange(newDate)
	}

	const timeString = value ? format(value, "HH:mm:ss") : defaultTime

	return (
		<div className={cn("flex items-center gap-2", className)}>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						className={cn(
							className,
							"h-10 flex-1 justify-start text-left font-normal",
							"data-[empty=true]:text-muted-foreground"
						)}
						data-empty={!value}
						variant="outline"
					>
						<CalendarIcon />
						{value ? format(value, "PPP") : <span>Pick a date</span>}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0">
					<Calendar
						defaultMonth={value}
						mode="single"
						onSelect={handleDateSelect}
						required
						selected={value}
					/>
				</PopoverContent>
			</Popover>

			{withTime && (
				<Input
					className="h-10 w-fit appearance-none bg-background text-sm [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
					onChange={handleTimeChange}
					step="1"
					type="time"
					value={timeString}
				/>
			)}
		</div>
	)
}
