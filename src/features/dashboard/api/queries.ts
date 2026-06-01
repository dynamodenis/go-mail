import {
	useQuery,
	type QueryClient,
	type UseQueryOptions,
} from "@tanstack/react-query";
import { unwrap } from "@/lib/server-result";
import type { DateRange } from "../types";
import * as server from "./server";

// ─── Query Key Factory ──────────────────────────────────────────────────────

export const dashboardKeys = {
	all: ["dashboard"] as const,
	kpis: (range: DateRange) => [...dashboardKeys.all, "kpis", range] as const,
	sendsOverTime: (range: DateRange) =>
		[...dashboardKeys.all, "sendsOverTime", range] as const,
	engagementTrend: (range: DateRange) =>
		[...dashboardKeys.all, "engagementTrend", range] as const,
	sendTimeDistribution: (range: DateRange) =>
		[...dashboardKeys.all, "sendTimeDistribution", range] as const,
	campaignPerformance: (range: DateRange) =>
		[...dashboardKeys.all, "campaignPerformance", range] as const,
	audienceGrowth: (range: DateRange) =>
		[...dashboardKeys.all, "audienceGrowth", range] as const,
	domainBreakdown: () => [...dashboardKeys.all, "domainBreakdown"] as const,
	bounceBreakdown: (range: DateRange) =>
		[...dashboardKeys.all, "bounceBreakdown", range] as const,
	recentCampaigns: () =>
		[...dashboardKeys.all, "recentCampaigns"] as const,
};

const STALE_1_MIN = 60_000;
const STALE_5_MIN = 300_000;

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useDashboardKpis(
	range: DateRange,
	queryClient?: QueryClient,
) {
	return useQuery(
		{
			queryKey: dashboardKeys.kpis(range),
			queryFn: async () =>
				unwrap(await server.getDashboardKpis({ data: { dateRange: range } })),
			staleTime: STALE_1_MIN,
		} satisfies UseQueryOptions,
		queryClient,
	);
}

export function useSendsOverTime(
	range: DateRange,
	queryClient?: QueryClient,
) {
	return useQuery(
		{
			queryKey: dashboardKeys.sendsOverTime(range),
			queryFn: async () =>
				unwrap(await server.getSendsOverTime({ data: { dateRange: range } })),
			staleTime: STALE_1_MIN,
		} satisfies UseQueryOptions,
		queryClient,
	);
}

export function useEngagementTrend(
	range: DateRange,
	queryClient?: QueryClient,
) {
	return useQuery(
		{
			queryKey: dashboardKeys.engagementTrend(range),
			queryFn: async () =>
				unwrap(await server.getEngagementTrend({ data: { dateRange: range } })),
			staleTime: STALE_1_MIN,
		} satisfies UseQueryOptions,
		queryClient,
	);
}

export function useSendTimeDistribution(
	range: DateRange,
	queryClient?: QueryClient,
) {
	return useQuery(
		{
			queryKey: dashboardKeys.sendTimeDistribution(range),
			queryFn: async () =>
				unwrap(
					await server.getSendTimeDistribution({ data: { dateRange: range } }),
				),
			staleTime: STALE_1_MIN,
		} satisfies UseQueryOptions,
		queryClient,
	);
}

export function useCampaignPerformance(
	range: DateRange,
	queryClient?: QueryClient,
) {
	return useQuery(
		{
			queryKey: dashboardKeys.campaignPerformance(range),
			queryFn: async () =>
				unwrap(
					await server.getCampaignPerformance({ data: { dateRange: range } }),
				),
			staleTime: STALE_1_MIN,
		} satisfies UseQueryOptions,
		queryClient,
	);
}

export function useAudienceGrowth(
	range: DateRange,
	queryClient?: QueryClient,
) {
	return useQuery(
		{
			queryKey: dashboardKeys.audienceGrowth(range),
			queryFn: async () =>
				unwrap(await server.getAudienceGrowth({ data: { dateRange: range } })),
			staleTime: STALE_1_MIN,
		} satisfies UseQueryOptions,
		queryClient,
	);
}

export function useDomainBreakdown(queryClient?: QueryClient) {
	return useQuery(
		{
			queryKey: dashboardKeys.domainBreakdown(),
			queryFn: async () => unwrap(await server.getDomainBreakdown()),
			staleTime: STALE_5_MIN,
		} satisfies UseQueryOptions,
		queryClient,
	);
}

export function useBounceBreakdown(
	range: DateRange,
	queryClient?: QueryClient,
) {
	return useQuery(
		{
			queryKey: dashboardKeys.bounceBreakdown(range),
			queryFn: async () =>
				unwrap(await server.getBounceBreakdown({ data: { dateRange: range } })),
			staleTime: STALE_1_MIN,
		} satisfies UseQueryOptions,
		queryClient,
	);
}

export function useRecentCampaigns(queryClient?: QueryClient) {
	return useQuery(
		{
			queryKey: dashboardKeys.recentCampaigns(),
			queryFn: async () => unwrap(await server.getRecentCampaigns()),
			staleTime: STALE_1_MIN,
		} satisfies UseQueryOptions,
		queryClient,
	);
}
