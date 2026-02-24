import { PageHeader } from "@/components/shared/page-header";
import { DashboardDateFilter } from "./dashboard-date-filter";
import { StatsCardGrid } from "./stats-card-grid";
import { SendsVolumeChart } from "./sends-volume-chart";
import { EngagementTrendChart } from "./engagement-trend-chart";
import { SendTimeHeatmap } from "./send-time-heatmap";
import { CampaignPerformanceChart } from "./campaign-performance-chart";
import { AudienceGrowthChart } from "./audience-growth-chart";
import { DomainBreakdownChart } from "./domain-breakdown-chart";
import { BounceBreakdownChart } from "./bounce-breakdown-chart";
import { RecentCampaignsTable } from "./recent-campaigns-table";

export default function Dashboard() {
	return (
		<div className="space-y-6">
			<PageHeader
				title="Dashboard"
				description="Overview of your email marketing performance."
				actions={<DashboardDateFilter />}
			/>

			<StatsCardGrid />

			{/* Row 1: Send Volume + Engagement */}
			<div className="grid gap-6 md:grid-cols-2">
				<SendsVolumeChart />
				<EngagementTrendChart />
			</div>

			{/* Row 2: Send Time Heatmap (full width) */}
			<SendTimeHeatmap />

			{/* Row 3: Campaign Performance + Audience Growth */}
			<div className="grid gap-6 md:grid-cols-2">
				<CampaignPerformanceChart />
				<AudienceGrowthChart />
			</div>

			{/* Row 4: Recent Campaigns (2 cols) + Pie Charts (1 col) */}
			<div className="grid gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<RecentCampaignsTable />
				</div>
				<div className="space-y-6">
					<DomainBreakdownChart />
					<BounceBreakdownChart />
				</div>
			</div>
		</div>
	);
}
