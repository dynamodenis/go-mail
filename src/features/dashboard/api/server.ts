import { createServerFn } from "@tanstack/react-start";
import { requireUserId } from "@/lib/require-user";
import { handleServerError } from "@/lib/errors";
import { dashboardFiltersSchema } from "../types";
import * as service from "./service";

/**
 * Get the 6 KPI cards for the dashboard.
 * @auth Required
 * @throws UNAUTHORIZED
 */
export const getDashboardKpis = createServerFn({ method: "GET" })
	.inputValidator(
		(data: { dateRange: string }) => dashboardFiltersSchema.parse(data),
	)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			return { data: await service.getDashboardKpis(userId, data.dateRange) };
		} catch (error) {
			return handleServerError(error);
		}
	});

/**
 * Get daily send volume over the selected date range.
 * @auth Required
 */
export const getSendsOverTime = createServerFn({ method: "GET" })
	.inputValidator(
		(data: { dateRange: string }) => dashboardFiltersSchema.parse(data),
	)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			return { data: await service.getSendsOverTime(userId, data.dateRange) };
		} catch (error) {
			return handleServerError(error);
		}
	});

/**
 * Get daily open rate and click rate trend.
 * @auth Required
 */
export const getEngagementTrend = createServerFn({ method: "GET" })
	.inputValidator(
		(data: { dateRange: string }) => dashboardFiltersSchema.parse(data),
	)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			return { data: await service.getEngagementTrend(userId, data.dateRange) };
		} catch (error) {
			return handleServerError(error);
		}
	});

/**
 * Get send time distribution heatmap data (day of week x hour).
 * @auth Required
 */
export const getSendTimeDistribution = createServerFn({ method: "GET" })
	.inputValidator(
		(data: { dateRange: string }) => dashboardFiltersSchema.parse(data),
	)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			return {
				data: await service.getSendTimeDistribution(userId, data.dateRange),
			};
		} catch (error) {
			return handleServerError(error);
		}
	});

/**
 * Get top 10 campaigns by open rate within the date range.
 * @auth Required
 */
export const getCampaignPerformance = createServerFn({ method: "GET" })
	.inputValidator(
		(data: { dateRange: string }) => dashboardFiltersSchema.parse(data),
	)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			return {
				data: await service.getCampaignPerformance(userId, data.dateRange),
			};
		} catch (error) {
			return handleServerError(error);
		}
	});

/**
 * Get daily new contacts vs unsubscribes for audience growth chart.
 * @auth Required
 */
export const getAudienceGrowth = createServerFn({ method: "GET" })
	.inputValidator(
		(data: { dateRange: string }) => dashboardFiltersSchema.parse(data),
	)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			return { data: await service.getAudienceGrowth(userId, data.dateRange) };
		} catch (error) {
			return handleServerError(error);
		}
	});

/**
 * Get top 10 email domains among active contacts.
 * @auth Required
 */
export const getDomainBreakdown = createServerFn({ method: "GET" }).handler(
	async () => {
		try {
			const userId = await requireUserId();
			return { data: await service.getDomainBreakdown(userId) };
		} catch (error) {
			return handleServerError(error);
		}
	},
);

/**
 * Get hard vs soft bounce breakdown within the date range.
 * @auth Required
 */
export const getBounceBreakdown = createServerFn({ method: "GET" })
	.inputValidator(
		(data: { dateRange: string }) => dashboardFiltersSchema.parse(data),
	)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			return { data: await service.getBounceBreakdown(userId, data.dateRange) };
		} catch (error) {
			return handleServerError(error);
		}
	});

/**
 * Get the 10 most recent campaigns with computed open/click rates.
 * @auth Required
 */
export const getRecentCampaigns = createServerFn({ method: "GET" }).handler(
	async () => {
		try {
			const userId = await requireUserId();
			return { data: await service.getRecentCampaigns(userId) };
		} catch (error) {
			return handleServerError(error);
		}
	},
);
