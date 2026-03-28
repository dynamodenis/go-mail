import {
	useQuery,
	useMutation,
	useQueryClient,
	type QueryClient,
	type UseQueryOptions,
} from "@tanstack/react-query";
import type { EmailScheduleFilters } from "../types";
import * as server from "./server";

export const emailScheduleKeys = {
	all: ["email-schedules"] as const,
	list: (filters?: EmailScheduleFilters) =>
		[...emailScheduleKeys.all, "list", filters] as const,
	detail: (id: string) => [...emailScheduleKeys.all, "detail", id] as const,
};

const STALE_1_MIN = 60_000;

export function useEmailSchedules(
	filters?: EmailScheduleFilters,
	queryClient?: QueryClient,
) {
	return useQuery(
		{
			queryKey: emailScheduleKeys.list(filters),
			queryFn: () => server.getEmailSchedules({ data: filters ?? {} }),
			staleTime: STALE_1_MIN,
		} satisfies UseQueryOptions,
		queryClient,
	);
}

export function useEmailSchedule(id: string, queryClient?: QueryClient) {
	return useQuery(
		{
			queryKey: emailScheduleKeys.detail(id),
			queryFn: () => server.getEmailScheduleById({ data: { id } }),
			staleTime: STALE_1_MIN,
			enabled: !!id,
		} satisfies UseQueryOptions,
		queryClient,
	);
}

export function useCreateEmailSchedule(queryClient?: QueryClient) {
	const qc = queryClient ?? useQueryClient();
	return useMutation(
		{
			mutationFn: (
				input: Parameters<typeof server.createEmailSchedule>[0]["data"],
			) => server.createEmailSchedule({ data: input }),
			onSuccess: () => {
				qc.invalidateQueries({ queryKey: emailScheduleKeys.all });
			},
		},
		qc,
	);
}

export function useCancelEmailSchedule(queryClient?: QueryClient) {
	const qc = queryClient ?? useQueryClient();
	return useMutation(
		{
			mutationFn: (id: string) =>
				server.cancelEmailSchedule({ data: { id } }),
			onSuccess: () => {
				qc.invalidateQueries({ queryKey: emailScheduleKeys.all });
			},
		},
		qc,
	);
}
