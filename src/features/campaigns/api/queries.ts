import {
	createCampaign,
	deleteCampaign,
	getCampaignById,
	getCampaigns,
	updateCampaign,
} from "@/features/campaigns/api/server";
import type {
	CampaignFilters,
	CreateCampaignInput,
	UpdateCampaignInput,
} from "@/features/campaigns/types";
import { unwrap } from "@/lib/server-result";
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

const STALE_TIME = 30_000; // 30 seconds — campaign stats change as sends progress

export const campaignKeys = {
	all: ["campaigns"] as const,
	lists: () => [...campaignKeys.all, "list"] as const,
	list: (filters: CampaignFilters) =>
		[...campaignKeys.lists(), filters] as const,
	details: () => [...campaignKeys.all, "detail"] as const,
	detail: (id: string) => [...campaignKeys.details(), id] as const,
};

export function useCampaigns(filters: CampaignFilters) {
	return useQuery({
		queryKey: campaignKeys.list(filters),
		queryFn: async () => unwrap(await getCampaigns({ data: filters })),
		staleTime: STALE_TIME,
		placeholderData: keepPreviousData,
		retry: 2,
	});
}

export function useCampaign(id: string) {
	return useQuery({
		queryKey: campaignKeys.detail(id),
		queryFn: async () => unwrap(await getCampaignById({ data: { id } })),
		staleTime: STALE_TIME,
		enabled: !!id,
		retry: 2,
	});
}

export function useUpdateCampaign() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: UpdateCampaignInput) =>
			unwrap(await updateCampaign({ data: input })),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: campaignKeys.detail(variables.id),
			});
			queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
		},
	});
}

export function useCreateCampaign() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreateCampaignInput) =>
			unwrap(await createCampaign({ data: input })),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
		},
	});
}

export function useDeleteCampaign() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) =>
			unwrap(await deleteCampaign({ data: { id } })),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
		},
	});
}
