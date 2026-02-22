import { z } from "zod";

export const dateRangeSchema = z.enum(["7d", "30d", "90d"]);
export type DateRange = z.infer<typeof dateRangeSchema>;

export const dashboardFiltersSchema = z.object({
	dateRange: dateRangeSchema,
});
export type DashboardFilters = z.infer<typeof dashboardFiltersSchema>;

// ─── KPI Cards ──────────────────────────────────────────────────────────────

export interface KpiCardData {
	label: string;
	value: number;
	previousValue: number;
	changePercent: number;
	format: "number" | "percent" | "rate";
}

export interface DashboardKpiResponse {
	totalSends: KpiCardData;
	delivered: KpiCardData;
	opened: KpiCardData;
	clicked: KpiCardData;
	bounced: KpiCardData;
	totalContacts: KpiCardData;
}

// ─── Charts ─────────────────────────────────────────────────────────────────

export interface SendsOverTimeDataPoint {
	date: string;
	sent: number;
	delivered: number;
}

export interface EngagementTrendDataPoint {
	date: string;
	openRate: number;
	clickRate: number;
}

export interface SendTimeCell {
	dayOfWeek: number;
	hour: number;
	count: number;
}

export interface CampaignPerformanceItem {
	campaignId: string;
	name: string;
	totalSends: number;
	openRate: number;
	clickRate: number;
}

export interface AudienceGrowthDataPoint {
	date: string;
	newContacts: number;
	unsubscribes: number;
	netGrowth: number;
}

export interface DomainBreakdownItem {
	domain: string;
	count: number;
	percentage: number;
}

export interface BounceBreakdownItem {
	type: "hard" | "soft";
	count: number;
	percentage: number;
}

// ─── Recent Campaigns Table ─────────────────────────────────────────────────

export interface RecentCampaignItem {
	id: string;
	name: string;
	status: string;
	sentAt: string | null;
	totalSends: number;
	openRate: number;
	clickRate: number;
}
