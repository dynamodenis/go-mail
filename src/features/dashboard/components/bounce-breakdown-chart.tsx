import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	Tooltip,
	Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBounceBreakdown } from "../api/queries";
import { useDashboardUIStore } from "../api/store";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { ShieldAlert } from "lucide-react";

const COLORS = {
	hard: "hsl(var(--destructive))",
	soft: "hsl(var(--chart-4))",
};

export function BounceBreakdownChart() {
	const range = useDashboardUIStore((s) => s.selectedDateRange);
	const { data, isLoading, isError, refetch } = useBounceBreakdown(range);

	const items = data?.data ?? [];

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base">Bounce Breakdown</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading && <LoadingState message="Loading chart..." />}
				{isError && (
					<ErrorState
						message="Failed to load bounce data."
						onRetry={() => refetch()}
					/>
				)}
				{!isLoading && !isError && items.length === 0 && (
					<EmptyState
						icon={ShieldAlert}
						title="No bounces"
						description="Great news — no bounced emails in this period."
					/>
				)}
				{!isLoading && !isError && items.length > 0 && (
					<ResponsiveContainer width="100%" height={250}>
						<PieChart>
							<Pie
								data={items}
								dataKey="count"
								nameKey="type"
								cx="50%"
								cy="50%"
								innerRadius={40}
								outerRadius={70}
								paddingAngle={4}
							>
								{items.map((item) => (
									<Cell key={item.type} fill={COLORS[item.type]} />
								))}
							</Pie>
							<Tooltip
								formatter={(value, name) => {
									const item = items.find((i) => i.type === name);
									return [
										`${value} (${item?.percentage ?? 0}%)`,
										`${name} bounce`,
									];
								}}
							/>
							<Legend
								formatter={(value: string) =>
									`${value.charAt(0).toUpperCase()}${value.slice(1)} Bounce`
								}
							/>
						</PieChart>
					</ResponsiveContainer>
				)}
			</CardContent>
		</Card>
	);
}
