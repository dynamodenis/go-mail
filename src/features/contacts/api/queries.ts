// TODO: Implement Contacts React Query hooks
// All query and mutation hooks for the contacts feature go here.
// - Define query keys as arrays: ['contacts', ...params]
// - Wrap server functions with useQuery/useMutation
// - Set appropriate staleTime values
// - Accept optional queryClient parameter for testing
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveContact } from "@/features/contacts/api/server";
import type { CreateContactInput } from "@/features/contacts/schemas/types";

export const contactsKeys = {
	all: ["contacts"] as const,
	contact: (id: string) => [...contactsKeys.all, id] as const,
};

export function useSaveContact() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (contact: CreateContactInput) =>
			saveContact({ data: contact }),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: contactsKeys.all });
		},
		onError: (error) => {
			console.error("Failed to save contact:", error);
		},
	});
}