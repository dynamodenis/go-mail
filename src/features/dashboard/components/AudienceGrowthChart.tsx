import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
	Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAudienceGrowth } from "../api/queries";
import { useDashboardUIStore } from "../api/store";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Users } from "lucide-react";

export function AudienceGrowthChart() {
	const range = useDashboardUIStore((s) => s.selectedDateRange);
	const { data, isLoading, isError, refetch } = useAudienceGrowth(range);

	const items = data?.data ?? [];

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base">Audience Growth</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading && <LoadingState message="Loading chart..." />}
				{isError && (
					<ErrorState
						message="Failed to load audience growth."
						onRetry={() => refetch()}
					/>
				)}
				{!isLoading && !isError && items.length === 0 && (
					<EmptyState
						icon={Users}
						title="No audience data"
						description="Audience growth will appear as contacts join or leave."
					/>
				)}
				{!isLoading && !isError && items.length > 0 && (
					<ResponsiveContainer width="100%" height={280}>
						<AreaChart data={items}>
							<CartesianGrid strokeDasharray="3 3" className="stroke-border" />
							<XAxis dataKey="date" tick={{ fontSize: 12 }} />
							<YAxis tick={{ fontSize: 12 }} />
							<Tooltip />
							<Legend />
							<Area
								type="monotone"
								dataKey="newContacts"
								name="New Contacts"
								fill="hsl(var(--primary))"
								fillOpacity={0.3}
								stroke="hsl(var(--primary))"
								stackId="1"
							/>
							<Area
								type="monotone"
								dataKey="unsubscribes"
								name="Unsubscribes"
								fill="hsl(var(--destructive))"
								fillOpacity={0.3}
								stroke="hsl(var(--destructive))"
								stackId="2"
							/>
							<Line
								type="monotone"
								dataKey="netGrowth"
								name="Net Growth"
								stroke="hsl(var(--chart-2))"
								strokeWidth={2}
								dot={false}
							/>
						</AreaChart>
					</ResponsiveContainer>
				)}
			</CardContent>
		</Card>
	);
}
