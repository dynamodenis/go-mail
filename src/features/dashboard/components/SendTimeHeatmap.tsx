import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSendTimeDistribution } from "../api/queries";
import { useDashboardUIStore } from "../api/store";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Clock } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getIntensityClass(count: number, max: number): string {
	if (count === 0 || max === 0) return "bg-muted";
	const ratio = count / max;
	if (ratio < 0.25) return "bg-primary/20";
	if (ratio < 0.5) return "bg-primary/40";
	if (ratio < 0.75) return "bg-primary/60";
	return "bg-primary/90";
}

export function SendTimeHeatmap() {
	const range = useDashboardUIStore((s) => s.selectedDateRange);
	const { data, isLoading, isError, refetch } =
		useSendTimeDistribution(range);

	const cells = data?.data ?? [];
	const maxCount = cells.length > 0 ? Math.max(...cells.map((c) => c.count)) : 0;

	const grid = new Map<string, number>();
	for (const cell of cells) {
		grid.set(`${cell.dayOfWeek}-${cell.hour}`, cell.count);
	}

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base">Send Time Distribution</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading && <LoadingState message="Loading heatmap..." />}
				{isError && (
					<ErrorState
						message="Failed to load send times."
						onRetry={() => refetch()}
					/>
				)}
				{!isLoading && !isError && cells.length === 0 && (
					<EmptyState
						icon={Clock}
						title="No send data"
						description="Send time patterns will appear after your campaigns go out."
					/>
				)}
				{!isLoading && !isError && cells.length > 0 && (
					<div className="overflow-x-auto">
						<div className="min-w-[600px]">
							{/* Hour labels */}
							<div className="mb-1 flex gap-0.5 pl-10">
								{HOURS.filter((h) => h % 3 === 0).map((h) => (
									<span
										key={h}
										className="text-[10px] text-muted-foreground"
										style={{ width: `${(3 / 24) * 100}%` }}
									>
										{h}:00
									</span>
								))}
							</div>
							{/* Grid rows */}
							{DAYS.map((day, dayIdx) => (
								<div key={day} className="flex items-center gap-0.5">
									<span className="w-10 shrink-0 text-right text-xs text-muted-foreground pr-2">
										{day}
									</span>
									{HOURS.map((hour) => {
										const count = grid.get(`${dayIdx}-${hour}`) ?? 0;
										return (
											<div
												key={hour}
												className={`h-5 flex-1 rounded-sm ${getIntensityClass(count, maxCount)}`}
												title={`${day} ${hour}:00 — ${count} sends`}
											/>
										);
									})}
								</div>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
