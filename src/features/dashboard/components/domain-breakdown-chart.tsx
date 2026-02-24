import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	Tooltip,
	Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDomainBreakdown } from "../api/queries";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Globe } from "lucide-react";

const COLORS = [
	"hsl(var(--primary))",
	"hsl(var(--chart-2))",
	"hsl(var(--chart-3))",
	"hsl(var(--chart-4))",
	"hsl(var(--chart-5))",
	"hsl(var(--muted-foreground))",
];

export function DomainBreakdownChart() {
	const { data, isLoading, isError, refetch } = useDomainBreakdown();

	const items = data?.data ?? [];

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base">Email Domains</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading && <LoadingState message="Loading chart..." />}
				{isError && (
					<ErrorState
						message="Failed to load domain breakdown."
						onRetry={() => refetch()}
					/>
				)}
				{!isLoading && !isError && items.length === 0 && (
					<EmptyState
						icon={Globe}
						title="No contacts yet"
						description="Add contacts to see their email domain distribution."
					/>
				)}
				{!isLoading && !isError && items.length > 0 && (
					<ResponsiveContainer width="100%" height={250}>
						<PieChart>
							<Pie
								data={items}
								dataKey="count"
								nameKey="domain"
								cx="50%"
								cy="50%"
								innerRadius={50}
								outerRadius={80}
								paddingAngle={2}
							>
								{items.map((_, idx) => (
									<Cell
										key={idx}
										fill={COLORS[idx % COLORS.length]}
									/>
								))}
							</Pie>
							<Tooltip
								formatter={(value, name) => [
									`${value} (${items.find((i) => i.domain === name)?.percentage ?? 0}%)`,
									name,
								]}
							/>
							<Legend />
						</PieChart>
					</ResponsiveContainer>
				)}
			</CardContent>
		</Card>
	);
}
