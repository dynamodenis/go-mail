import {
	useQuery,
	useMutation,
	useQueryClient,
	type QueryClient,
	type UseQueryOptions,
} from "@tanstack/react-query";
import type { TemplateFilters } from "../types";
import * as server from "./server";

// Query Key Factory
export const templateKeys = {
	all: ["templates"] as const,
	list: (filters?: TemplateFilters) =>
		[...templateKeys.all, "list", filters] as const,
	detail: (id: string) => [...templateKeys.all, "detail", id] as const,
};

const STALE_5_MIN = 300_000;

export function useTemplates(
	filters?: TemplateFilters,
	queryClient?: QueryClient,
) {
	return useQuery(
		{
			queryKey: templateKeys.list(filters),
			queryFn: () => server.getTemplates({ data: filters ?? {} }),
			staleTime: STALE_5_MIN,
		} satisfies UseQueryOptions,
		queryClient,
	);
}

export function useTemplate(id: string, queryClient?: QueryClient) {
	return useQuery(
		{
			queryKey: templateKeys.detail(id),
			queryFn: () => server.getTemplateById({ data: { id } }),
			staleTime: STALE_5_MIN,
			enabled: !!id,
		} satisfies UseQueryOptions,
		queryClient,
	);
}

export function useCreateTemplate(queryClient?: QueryClient) {
	const qc = queryClient ?? useQueryClient();
	return useMutation(
		{
			mutationFn: (
				input: Parameters<typeof server.createTemplate>[0]["data"],
			) => server.createTemplate({ data: input }),
			onSuccess: () => {
				qc.invalidateQueries({ queryKey: templateKeys.all });
			},
		},
		qc,
	);
}

export function useUpdateTemplate(queryClient?: QueryClient) {
	const qc = queryClient ?? useQueryClient();
	return useMutation(
		{
			mutationFn: (
				input: Parameters<typeof server.updateTemplate>[0]["data"],
			) => server.updateTemplate({ data: input }),
			onSuccess: () => {
				qc.invalidateQueries({ queryKey: templateKeys.all });
			},
		},
		qc,
	);
}

export function useDeleteTemplate(queryClient?: QueryClient) {
	const qc = queryClient ?? useQueryClient();
	return useMutation(
		{
			mutationFn: (id: string) => server.deleteTemplate({ data: { id } }),
			onSuccess: () => {
				qc.invalidateQueries({ queryKey: templateKeys.all });
			},
		},
		qc,
	);
}

export function useAddAttachment(queryClient?: QueryClient) {
	const qc = queryClient ?? useQueryClient();
	return useMutation(
		{
			mutationFn: (
				input: Parameters<typeof server.addTemplateAttachment>[0]["data"],
			) => server.addTemplateAttachment({ data: input }),
			onSuccess: () => {
				qc.invalidateQueries({ queryKey: templateKeys.all });
			},
		},
		qc,
	);
}

export function useRemoveAttachment(queryClient?: QueryClient) {
	const qc = queryClient ?? useQueryClient();
	return useMutation(
		{
			mutationFn: (attachmentId: string) =>
				server.removeTemplateAttachment({ data: { attachmentId } }),
			onSuccess: () => {
				qc.invalidateQueries({ queryKey: templateKeys.all });
			},
		},
		qc,
	);
}

export function useAddMergeTag(queryClient?: QueryClient) {
	const qc = queryClient ?? useQueryClient();
	return useMutation(
		{
			mutationFn: (
				input: Parameters<typeof server.addTemplateMergeTag>[0]["data"],
			) => server.addTemplateMergeTag({ data: input }),
			onSuccess: () => {
				qc.invalidateQueries({ queryKey: templateKeys.all });
			},
		},
		qc,
	);
}

export function useRemoveMergeTag(queryClient?: QueryClient) {
	const qc = queryClient ?? useQueryClient();
	return useMutation(
		{
			mutationFn: (tagId: string) =>
				server.removeTemplateMergeTag({ data: { tagId } }),
			onSuccess: () => {
				qc.invalidateQueries({ queryKey: templateKeys.all });
			},
		},
		qc,
	);
}
