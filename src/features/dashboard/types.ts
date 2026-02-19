import { z } from "zod";

export const dateRangeSchema = z.enum(["7d", "30d", "90d"]);
export type DateRange = z.infer<typeof dateRangeSchema>;

export const dashboardFiltersSchema = z.object({
  dateRange: dateRangeSchema,
});
export type DashboardFilters = z.infer<typeof dashboardFiltersSchema>;

export interface DashboardStats {
  totalContacts: number;
  totalCampaigns: number;
  totalEmailsSent: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
}

export interface DashboardSendsDataPoint {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
}

export interface RecentActivityItem {
  id: string;
  type: "campaign_sent" | "contact_added" | "template_created" | "campaign_created";
  description: string;
  createdAt: string;
}
