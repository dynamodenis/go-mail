import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import type {
	CampaignSearchParams,
	CampaignStatus,
} from "@/features/campaigns/types";
import { Route } from "@/routes/_authenticated/campaigns/index";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Megaphone, Plus } from "lucide-react";
import { useCallback, useDeferredValue, useMemo, useTransition } from "react";
import { useCampaigns } from "../api/queries";
import { campaignColumns } from "./campaigns-table/campaign-columns";
import { CampaignsDataTable } from "./campaigns-table/campaigns-data-table";
import { CampaignsTablePagination } from "./campaigns-table/campaigns-table-pagination";
import { CampaignsToolbar } from "./campaigns-table/campaigns-toolbar";
import { DeleteCampaignDialog } from "./delete-campaign-dialog";

export default function Campaigns() {
	const { search, status, page, pageSize } = Route.useSearch();
	const router = useRouter();
	const navigate = useNavigate();
	const [, startTransition] = useTransition();

	const deferredSearch = useDeferredValue(search);
	const filters = useMemo(
		() => ({ search: deferredSearch, status, page, pageSize }),
		[deferredSearch, status, page, pageSize],
	);
	const { data, isLoading, isFetching, isError, refetch } =
		useCampaigns(filters);
	const isSearching = deferredSearch !== search || isFetching;

	const campaigns = data?.data ?? [];
	const totalRows = data?.total ?? 0;

	const updateSearch = useCallback(
		(updates: {
			search?: string;
			status?: CampaignStatus | undefined;
			page?: number;
			pageSize?: number;
		}) => {
			startTransition(() => {
				router.navigate({
					to: "/campaigns",
					search: (prev: CampaignSearchParams) => ({
						...prev,
						...updates,
						page: updates.page ?? 1,
					}),
					replace: true,
					resetScroll: false,
				});
			});
		},
		[router],
	);

	const table = useReactTable({
		data: campaigns,
		columns: campaignColumns,
		getRowId: (row) => row.id,
		pageCount: Math.ceil(totalRows / pageSize) || 1,
		state: { pagination: { pageIndex: page - 1, pageSize } },
		onPaginationChange: (updater) => {
			const next =
				typeof updater === "function"
					? updater({ pageIndex: page - 1, pageSize })
					: updater;
			updateSearch({ page: next.pageIndex + 1, pageSize: next.pageSize });
		},
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
	});

	return (
		<div className="space-y-1">
			<PageHeader
				title="Campaigns"
				description="Create, schedule, and track your email campaigns."
				actions={
					<Button onClick={() => navigate({ to: "/campaigns/new" })} size={"sm"}>
						<Plus className="mr-1 h-4 w-4" />
						New Campaign
					</Button>
				}
			/>

			<DeleteCampaignDialog />

			<CampaignsToolbar
				search={search}
				status={status}
				onFilterChange={(f) => updateSearch(f)}
			/>

			{isLoading && !data ? (
				<LoadingState message="Loading campaigns..." />
			) : isError ? (
				<ErrorState
				
					message="Failed to load campaigns. Please try again."
					onRetry={() => refetch()}
				/>
			) : campaigns.length === 0 && !search && !status ? (
				<EmptyState
					icon={Megaphone}
					title="No campaigns yet"
					description="Create your first campaign to start reaching your contacts."
					actionLabel="New Campaign"
					onAction={() => navigate({ to: "/campaigns/new" })}
				/>
			) : (
				<div className={isSearching ? "opacity-60 transition-opacity" : ""}>
					<CampaignsDataTable table={table} />
					<CampaignsTablePagination
						table={table}
						totalRows={totalRows}
						onPageSizeChange={(size) => updateSearch({ pageSize: size })}
					/>
				</div>
			)}
		</div>
	);
}
