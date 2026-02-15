import { AlertTriangleIcon } from "lucide-react"
import type { ChannelModel } from "shared"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"

interface ChannelSelectionSheetProps {
	channels: ChannelModel[]
	loading: boolean
	error: string | null
	open: boolean
	onOpenChange: (open: boolean) => void
	onSelect: (channelId: number) => void
	applying: boolean
}

export function ChannelSelectionSheet({
	channels,
	loading,
	error,
	open,
	onOpenChange,
	onSelect,
	applying,
}: ChannelSelectionSheetProps) {
	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			<SheetContent className="max-h-[70vh] overflow-y-auto" side="bottom">
				<SheetHeader>
					<SheetTitle>Select a Channel</SheetTitle>
				</SheetHeader>
				<div className="mt-4">
					{loading ? (
						<div className="flex justify-center py-8">
							<Spinner />
						</div>
					) : error ? (
						<div className="flex flex-col gap-2 px-4">
							<Alert className="max-w-md border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
								<AlertTriangleIcon />
								<AlertTitle className="line-clamp-none">{error}</AlertTitle>
							</Alert>
						</div>
					) : (
						<div className="flex flex-col gap-2 px-4">
							{channels.map((channel) => (
								<button
									className="flex items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
									disabled={applying}
									key={channel.id}
									onClick={() => onSelect(channel.id)}
									type="button"
								>
									<div className="flex flex-col">
										<span className="font-medium">{channel.title}</span>
										<span className="text-muted-foreground text-xs">
											{channel.subCount.toLocaleString()} subs •{" "}
											{channel.avgPostReach?.toLocaleString()} avg views
										</span>
									</div>
									{applying && <Spinner data-icon="inline-start" />}
								</button>
							))}
						</div>
					)}
				</div>
				<SheetFooter>
					<SheetClose asChild>
						<Button variant="secondary">Close</Button>
					</SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}
