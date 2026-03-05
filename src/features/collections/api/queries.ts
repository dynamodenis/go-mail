import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createCollection,
	getCollections,
	getCollectionById,
	getCollectionContactIds,
	updateCollection,
	addContactsToCollections,
	removeContactsFromCollection,
	deleteCollection,
	deleteCollections,
} from "@/features/collections/api/server";
import { getContacts } from "@/features/contacts/api/server";
import type {
	AddContactsToCollectionsInput,
	CollectionFilters,
	CreateCollectionInput,
	RemoveContactsFromCollectionInput,
	UpdateCollectionInput,
} from "@/features/collections/schemas/types";
import type { ContactFilters } from "@/features/contacts/schemas/types";

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

/** Fetches the contact IDs that belong to a collection.
 *  Only enabled when collectionId is provided (edit mode). */
export function useCollectionContactIds(collectionId: string | null) {
	return useQuery({
		queryKey: collectionsKeys.detail(collectionId ?? ""),
		queryFn: () =>
			getCollectionContactIds({ data: { collectionId: collectionId! } }),
		enabled: !!collectionId,
		staleTime: STALE_TIME,
		select: (res) => ("error" in res ? [] : res.data),
	});
}

/** Fetches a single collection by ID for the detail page. */
export function useCollectionDetail(collectionId: string) {
	return useQuery({
		queryKey: collectionsKeys.detail(collectionId),
		queryFn: () => getCollectionById({ data: { id: collectionId } }),
		staleTime: STALE_TIME,
		select: (res) => ("error" in res ? null : res.data),
	});
}

/** Fetches contacts belonging to a collection with search/pagination. */
export function useCollectionContacts(filters: ContactFilters) {
	return useQuery({
		queryKey: [...collectionsKeys.detail(filters.collectionId!), "contacts", filters] as const,
		queryFn: () => getContacts({ data: filters }),
		staleTime: STALE_TIME,
		placeholderData: keepPreviousData,
		retry: 2,
		enabled: !!filters.collectionId,
		select: (res) => ("error" in res ? { data: [], total: 0, page: 1, pageSize: 25 } : res.data),
	});
}

/** Mutation to remove contacts from a collection. */
export function useRemoveContactsFromCollection() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: RemoveContactsFromCollectionInput) =>
			removeContactsFromCollection({ data: input }),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: collectionsKeys.all });
		},
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
			queryClient.invalidateQueries({ queryKey: collectionsKeys.all });
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

const SEARCH_PAGE_SIZE = 20;

/** Infinite query for searching contacts in the collection form.
 *  Supports deferred search with paginated infinite scroll. */
export function useSearchContacts(search: string) {
	return useInfiniteQuery({
		queryKey: ["contacts", "search", search] as const,
		queryFn: ({ pageParam = 1 }) =>
			getContacts({
				data: {
					search: search || undefined,
					page: pageParam,
					pageSize: SEARCH_PAGE_SIZE,
				},
			}),
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			if ("error" in lastPage) return undefined;
			const { page, pageSize, total } = lastPage.data;
			return page * pageSize < total ? page + 1 : undefined;
		},
		select: (data) => ({
			contacts: data.pages.flatMap((page) =>
				"error" in page ? [] : page.data.data,
			),
			total: data.pages[0] && !("error" in data.pages[0])
				? data.pages[0].data.total
				: 0,
		}),
		staleTime: STALE_TIME,
		enabled: true,
	});
}

/** Infinite query for searching collections (used in bulk add-to-collections dialog). */
export function useSearchCollections(search: string) {
	return useInfiniteQuery({
		queryKey: [...collectionsKeys.lists(), "search", search] as const,
		queryFn: ({ pageParam = 1 }) =>
			getCollections({
				data: {
					search: search || undefined,
					page: pageParam,
					pageSize: SEARCH_PAGE_SIZE,
				},
			}),
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			if ("error" in lastPage) return undefined;
			const { page, pageSize, total } = lastPage.data;
			return page * pageSize < total ? page + 1 : undefined;
		},
		select: (data) => ({
			collections: data.pages.flatMap((page) =>
				"error" in page ? [] : page.data.data,
			),
			total:
				data.pages[0] && !("error" in data.pages[0])
					? data.pages[0].data.total
					: 0,
		}),
		staleTime: STALE_TIME,
	});
}

/** Mutation to add multiple contacts to multiple collections. */
export function useAddContactsToCollections() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: AddContactsToCollectionsInput) =>
			addContactsToCollections({ data: input }),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: collectionsKeys.all });
		},
	});
}
