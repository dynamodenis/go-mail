import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEngagementTrend } from "../api/queries";
import { useDashboardUIStore } from "../api/store";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { MousePointerClick } from "lucide-react";

export function EngagementTrendChart() {
	const range = useDashboardUIStore((s) => s.selectedDateRange);
	const { data, isLoading, isError, refetch } = useEngagementTrend(range);

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base">Engagement Trend</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading && <LoadingState message="Loading chart..." />}
				{isError && (
					<ErrorState
						message="Failed to load engagement trend."
						onRetry={() => refetch()}
					/>
				)}
				{data?.data && data.data.length === 0 && (
					<EmptyState
						icon={MousePointerClick}
						title="No engagement data"
						description="Engagement trends will appear after your first campaign."
					/>
				)}
				{data?.data && data.data.length > 0 && (
					<ResponsiveContainer width="100%" height={280}>
						<LineChart data={data.data}>
							<CartesianGrid strokeDasharray="3 3" className="stroke-border" />
							<XAxis dataKey="date" tick={{ fontSize: 12 }} />
							<YAxis
								tick={{ fontSize: 12 }}
								tickFormatter={(v: number) => `${v}%`}
							/>
							<Tooltip formatter={(v) => `${v}%`} />
							<Legend />
							<Line
								type="monotone"
								dataKey="openRate"
								name="Open Rate"
								stroke="hsl(var(--primary))"
								strokeWidth={2}
								dot={false}
							/>
							<Line
								type="monotone"
								dataKey="clickRate"
								name="Click Rate"
								stroke="hsl(var(--chart-2))"
								strokeWidth={2}
								dot={false}
							/>
						</LineChart>
					</ResponsiveContainer>
				)}
			</CardContent>
		</Card>
	);
}
