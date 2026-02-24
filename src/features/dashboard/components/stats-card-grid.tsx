import { useDashboardKpis } from "../api/queries";
import { useDashboardUIStore } from "../api/store";
import { StatCard } from "./stat-card";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import type { DashboardKpiResponse } from "../types";

const KPI_ORDER: (keyof DashboardKpiResponse)[] = [
	"totalSends",
	"delivered",
	"opened",
	"clicked",
	"bounced",
	"totalContacts",
];

export function StatsCardGrid() {
	const range = useDashboardUIStore((s) => s.selectedDateRange);
	console.log("range", range);
	const { data, isLoading, isError, refetch } = useDashboardKpis(range);

	if (isLoading) {
		return <LoadingState message="Loading stats..." />;
	}

	if (isError) {
		return (
			<ErrorState
				message="Failed to load dashboard stats."
				onRetry={() => refetch()}
			/>
		);
	}

	const kpis = data?.data;
	if (!kpis) return null;

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{KPI_ORDER.map((key) => (
				<StatCard key={key} data={kpis[key]} />
			))}
		</div>
	);
}
