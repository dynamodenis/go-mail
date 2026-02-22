import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCampaignPerformance } from "../api/queries";
import { useDashboardUIStore } from "../api/store";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { BarChart3 } from "lucide-react";

export function CampaignPerformanceChart() {
	const range = useDashboardUIStore((s) => s.selectedDateRange);
	const { data, isLoading, isError, refetch } =
		useCampaignPerformance(range);

	const items = data?.data ?? [];

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base">Top Campaign Performance</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading && <LoadingState message="Loading chart..." />}
				{isError && (
					<ErrorState
						message="Failed to load campaign performance."
						onRetry={() => refetch()}
					/>
				)}
				{!isLoading && !isError && items.length === 0 && (
					<EmptyState
						icon={BarChart3}
						title="No campaigns yet"
						description="Campaign performance will appear once you send a campaign."
					/>
				)}
				{!isLoading && !isError && items.length > 0 && (
					<ResponsiveContainer width="100%" height={280}>
						<BarChart data={items} layout="vertical">
							<CartesianGrid strokeDasharray="3 3" className="stroke-border" />
							<XAxis
								type="number"
								tick={{ fontSize: 12 }}
								tickFormatter={(v: number) => `${v}%`}
							/>
							<YAxis
								type="category"
								dataKey="name"
								tick={{ fontSize: 11 }}
								width={120}
							/>
							<Tooltip formatter={(v) => `${v}%`} />
							<Legend />
							<Bar
								dataKey="openRate"
								name="Open Rate"
								fill="hsl(var(--primary))"
								radius={[0, 4, 4, 0]}
							/>
							<Bar
								dataKey="clickRate"
								name="Click Rate"
								fill="hsl(var(--chart-2))"
								radius={[0, 4, 4, 0]}
							/>
						</BarChart>
					</ResponsiveContainer>
				)}
			</CardContent>
		</Card>
	);
}
