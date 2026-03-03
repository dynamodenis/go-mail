import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createCollection,
	getCollections,
	updateCollection,
	deleteCollection,
	deleteCollections,
} from "@/features/collections/api/server";
import type {
	CollectionFilters,
	CreateCollectionInput,
	UpdateCollectionInput,
} from "@/features/collections/schemas/types";

const STALE_TIME = 300_000; // 5 minutes

export const collectionsKeys = {
	all: ["collections"] as const,
	lists: () => [...collectionsKeys.all, "list"] as const,
	list: (filters: CollectionFilters) =>
		[...collectionsKeys.lists(), filters] as const,
	details: () => [...collectionsKeys.all, "detail"] as const,
	detail: (id: string) => [...collectionsKeys.details(), id] as const,
};

export function useCollections(filters: CollectionFilters) {
	return useQuery({
		queryKey: collectionsKeys.list(filters),
		queryFn: () => getCollections({ data: filters }),
		staleTime: STALE_TIME,
		placeholderData: keepPreviousData,
		retry: 2,
		select: (res) =>
			"error" in res
				? { data: [], total: 0, page: 1, pageSize: 25 }
				: res.data,
	});
}

export function useCreateCollection() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreateCollectionInput) =>
			createCollection({ data: input }),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: collectionsKeys.lists() });
		},
	});
}

export function useUpdateCollection() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: UpdateCollectionInput) =>
			updateCollection({ data: input }),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: collectionsKeys.lists() });
		},
	});
}

export function useDeleteCollection() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteCollection({ data: { id } }),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: collectionsKeys.lists() });
		},
	});
}

export function useDeleteCollections() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (ids: string[]) => deleteCollections({ data: { ids } }),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: collectionsKeys.lists() });
		},
	});
}
