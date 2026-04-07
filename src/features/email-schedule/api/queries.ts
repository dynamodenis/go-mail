import {
	useQuery,
	useMutation,
	useQueryClient,
	type QueryClient,
	type UseQueryOptions,
} from "@tanstack/react-query";
import type { EmailBatchFilters, EmailBatchRecipientsFilters } from "../types";
import * as server from "./server";

export const emailBatchKeys = {
	all: ["email-batches"] as const,
	lists: () => [...emailBatchKeys.all, "list"] as const,
	list: (filters?: EmailBatchFilters) =>
		[...emailBatchKeys.lists(), filters] as const,
	details: () => [...emailBatchKeys.all, "detail"] as const,
	detail: (id: string) => [...emailBatchKeys.details(), id] as const,
	recipients: (
		batchId: string,
		filters?: Omit<EmailBatchRecipientsFilters, "batchId">,
	) => [...emailBatchKeys.all, "recipients", batchId, filters] as const,
};

const STALE_1_MIN = 60_000;

export function useEmailBatches(
	filters?: EmailBatchFilters,
	queryClient?: QueryClient,
) {
	return useQuery(
		{
			queryKey: emailBatchKeys.list(filters),
			queryFn: () => server.getEmailBatches({ data: filters ?? {} }),
			staleTime: STALE_1_MIN,
		} satisfies UseQueryOptions,
		queryClient,
	);
}

export function useEmailBatch(id: string, queryClient?: QueryClient) {
	return useQuery(
		{
			queryKey: emailBatchKeys.detail(id),
			queryFn: () => server.getEmailBatchById({ data: { id } }),
			staleTime: STALE_1_MIN,
			enabled: !!id,
		} satisfies UseQueryOptions,
		queryClient,
	);
}

export function useEmailBatchRecipients(
	filters: EmailBatchRecipientsFilters,
	queryClient?: QueryClient,
) {
	return useQuery(
		{
			queryKey: emailBatchKeys.recipients(filters.batchId, {
				status: filters.status,
				page: filters.page,
				pageSize: filters.pageSize,
			}),
			queryFn: () => server.getEmailBatchRecipients({ data: filters }),
			staleTime: STALE_1_MIN,
			enabled: !!filters.batchId,
		} satisfies UseQueryOptions,
		queryClient,
	);
}

export function useCreateEmailBatch(queryClient?: QueryClient) {
	const qc = queryClient ?? useQueryClient();
	return useMutation(
		{
			mutationFn: (
				input: Parameters<typeof server.createEmailBatch>[0]["data"],
			) => server.createEmailBatch({ data: input }),
			onSuccess: () => {
				qc.invalidateQueries({ queryKey: emailBatchKeys.lists() });
			},
		},
		qc,
	);
}

export function useCancelEmailBatch(queryClient?: QueryClient) {
	const qc = queryClient ?? useQueryClient();
	return useMutation(
		{
			mutationFn: (id: string) =>
				server.cancelEmailBatch({ data: { id } }),
			onSuccess: () => {
				qc.invalidateQueries({ queryKey: emailBatchKeys.all });
			},
		},
		qc,
	);
}
