import { Card, CardContent } from "@/components/ui/card"

interface StatCardProps {
	title: string
	value: string | number
}

export const StatCard = ({ title, value }: StatCardProps) => {
	return (
		<Card className="p-0">
			<CardContent className="p-4">
				<p className="mb-1 text-muted-foreground text-xs">{title}</p>
				<p className="font-bold text-xl">{value}</p>
			</CardContent>
		</Card>
	)
}
