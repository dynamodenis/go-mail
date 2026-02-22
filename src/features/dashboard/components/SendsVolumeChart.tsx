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
import { useSendsOverTime } from "../api/queries";
import { useDashboardUIStore } from "../api/store";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Send } from "lucide-react";

export function SendsVolumeChart() {
	const range = useDashboardUIStore((s) => s.selectedDateRange);
	const { data, isLoading, isError, refetch } = useSendsOverTime(range);

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base">Send Volume</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading && <LoadingState message="Loading chart..." />}
				{isError && (
					<ErrorState
						message="Failed to load send volume."
						onRetry={() => refetch()}
					/>
				)}
				{data?.data && data.data.length === 0 && (
					<EmptyState
						icon={Send}
						title="No sends yet"
						description="Send your first campaign to see volume data."
					/>
				)}
				{data?.data && data.data.length > 0 && (
					<ResponsiveContainer width="100%" height={280}>
						<LineChart data={data.data}>
							<CartesianGrid strokeDasharray="3 3" className="stroke-border" />
							<XAxis dataKey="date" tick={{ fontSize: 12 }} />
							<YAxis tick={{ fontSize: 12 }} />
							<Tooltip />
							<Legend />
							<Line
								type="monotone"
								dataKey="sent"
								name="Sent"
								stroke="hsl(var(--primary))"
								strokeWidth={2}
								dot={false}
							/>
							<Line
								type="monotone"
								dataKey="delivered"
								name="Delivered"
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
