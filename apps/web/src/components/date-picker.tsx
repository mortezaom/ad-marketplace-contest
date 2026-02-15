"use client"

import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
	value: Date | undefined
	onChange: (date: Date | undefined) => void
}

export function DatePickerComponent({ value, onChange }: DatePickerProps) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					className="w-70 justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
					data-empty={!value}
					variant="outline"
				>
					<CalendarIcon />
					{value ? format(value, "PPP") : <span>Pick a date</span>}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0">
				<Calendar mode="single" onSelect={onChange} required selected={value} />
			</PopoverContent>
		</Popover>
	)
}
