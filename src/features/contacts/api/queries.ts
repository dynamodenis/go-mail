import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	saveContact,
	getContacts,
	updateContact,
	deleteContact,
	deleteContacts,
	importContacts,
} from "@/features/contacts/api/server";
import type {
	ContactFilters,
	CreateContactInput,
	ImportContactsInput,
	UpdateContactInput,
} from "@/features/contacts/schemas/types";

const STALE_TIME = 300_000; // 5 minutes

export const contactsKeys = {
	all: ["contacts"] as const,
	lists: () => [...contactsKeys.all, "list"] as const,
	list: (filters: ContactFilters) =>
		[...contactsKeys.lists(), filters] as const,
	details: () => [...contactsKeys.all, "detail"] as const,
	detail: (id: string) => [...contactsKeys.details(), id] as const,
};

export function useContacts(filters: ContactFilters) {
	return useQuery({
		queryKey: contactsKeys.list(filters),
		queryFn: () => getContacts({ data: filters }),
		staleTime: STALE_TIME,
		placeholderData: keepPreviousData,
		retry: 2,
		select: (res) => ("error" in res ? { data: [], total: 0, page: 1, pageSize: 25 } : res.data),
	});
}

export function useSaveContact() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (contact: CreateContactInput) =>
			saveContact({ data: contact }),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
		},
	});
}

export function useUpdateContact() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: UpdateContactInput) =>
			updateContact({ data: input }),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
		},
	});
}

export function useDeleteContact() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteContact({ data: { id } }),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
		},
	});
}

export function useDeleteContacts() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (ids: string[]) => deleteContacts({ data: { ids } }),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
		},
	});
}

export function useImportContacts() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: ImportContactsInput) =>
			importContacts({ data: input }),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
		},
	});
}
