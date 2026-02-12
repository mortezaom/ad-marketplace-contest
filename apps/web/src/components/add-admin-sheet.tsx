import { useState } from "react"
import type { ChannelModel } from "shared"
import { toast } from "sonner"
import { request } from "@/lib/http"
import { usernameRegex } from "@/lib/tma"
import { Button } from "./ui/button"
import { ButtonGroup } from "./ui/button-group"
import { Field, FieldLabel } from "./ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "./ui/input-group"
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "./ui/sheet"

interface AdminSheetProps {
	channel: ChannelModel
	onAdminAdded: () => void
}

export const AddAdminSheet = ({ channel, onAdminAdded }: AdminSheetProps) => {
	const [input, setInput] = useState("")
	const [loading, setLoading] = useState(false)
	const [isValid, setIsValid] = useState(true)

	const [open, setOpen] = useState(false)

	const submitId = async () => {
		const username = input.replace("@", "").trim()
		if (!usernameRegex.test(username)) {
			toast.error("Invalid Channel ID.")
			setIsValid(false)
			return
		}
		setIsValid(true)
		setLoading(true)
		const res = await request<object | null>(`channels/${channel.tgId}/admins`, {
			method: "post",
			json: {
				newAdminUsername: username,
			},
		})
		setLoading(false)

		if (!res.ok) {
			toast.error(res.message)
			return
		}

		toast.success("User added as an admin to this channel!")
		setOpen(false)
		onAdminAdded()
	}

	return (
		<Sheet onOpenChange={setOpen} open={open}>
			<SheetTrigger asChild>
				<Button className="w-full">Add New</Button>
			</SheetTrigger>
			<SheetContent
				className="data-[side=bottom]:max-h-[50vh] data-[side=top]:max-h-[50vh]"
				side="bottom"
			>
				<SheetHeader>
					<SheetTitle>Add new Admin</SheetTitle>
					<SheetDescription>Enter the admin username and press Add admin.</SheetDescription>
				</SheetHeader>
				<div className="no-scrollbar overflow-y-auto px-4">
					<Field aria-invalid={!isValid} className="w-full">
						<FieldLabel htmlFor="input-group-url">Username</FieldLabel>
						<InputGroup className="w-full">
							<ButtonGroup>
								<InputGroupInput
									aria-invalid={!isValid}
									disabled={loading}
									id="input-group-url"
									onChange={(e) => setInput(e.target.value)}
									placeholder="drove"
									value={input}
								/>
							</ButtonGroup>
							<InputGroupAddon>
								<InputGroupText>@</InputGroupText>
							</InputGroupAddon>
						</InputGroup>
					</Field>
				</div>
				<SheetFooter>
					<Button onClick={submitId} type="button">
						Add Admin
					</Button>
					<SheetClose asChild>
						<Button variant="outline">Cancel</Button>
					</SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}
