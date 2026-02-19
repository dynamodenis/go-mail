import { z } from "zod";

export const reportTypeSchema = z.enum([
  "DELIVERABILITY",
  "ENGAGEMENT",
  "GROWTH",
]);
export type ReportType = z.infer<typeof reportTypeSchema>;

export const reportFiltersSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  campaignId: z.string().uuid().optional(),
  reportType: reportTypeSchema.optional(),
});
export type ReportFilters = z.infer<typeof reportFiltersSchema>;

export interface DeliverabilityReport {
  totalSent: number;
  delivered: number;
  bounced: number;
  rejected: number;
  deliveryRate: number;
  bounceRate: number;
  timeline: DeliverabilityDataPoint[];
}

export interface DeliverabilityDataPoint {
  date: string;
  sent: number;
  delivered: number;
  bounced: number;
}

export interface EngagementReport {
  totalOpened: number;
  totalClicked: number;
  totalUnsubscribed: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  unsubscribeRate: number;
  timeline: EngagementDataPoint[];
  topLinks: TopLink[];
}

export interface EngagementDataPoint {
  date: string;
  opened: number;
  clicked: number;
  unsubscribed: number;
}

export interface TopLink {
  url: string;
  clicks: number;
  uniqueClicks: number;
}

export interface GrowthReport {
  totalContacts: number;
  newContacts: number;
  unsubscribed: number;
  netGrowth: number;
  growthRate: number;
  timeline: GrowthDataPoint[];
}

export interface GrowthDataPoint {
  date: string;
  added: number;
  removed: number;
  net: number;
}
