import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardDateFilter } from "./DashboardDateFilter";
import { StatsCardGrid } from "./StatsCardGrid";
import { SendsVolumeChart } from "./SendsVolumeChart";
import { EngagementTrendChart } from "./EngagementTrendChart";
import { SendTimeHeatmap } from "./SendTimeHeatmap";
import { CampaignPerformanceChart } from "./CampaignPerformanceChart";
import { AudienceGrowthChart } from "./AudienceGrowthChart";
import { DomainBreakdownChart } from "./DomainBreakdownChart";
import { BounceBreakdownChart } from "./BounceBreakdownChart";
import { RecentCampaignsTable } from "./RecentCampaignsTable";

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
