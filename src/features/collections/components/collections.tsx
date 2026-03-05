import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Route } from "@/routes/_authenticated/contacts/collections/index";
import { useRouter } from "@tanstack/react-router";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { FolderPlus, Layers } from "lucide-react";
import { useCallback, useDeferredValue, useMemo, useState, useTransition } from "react";
import { useCollectionsUIStore } from "../api/store";
import { useCollections } from "../api/queries";
import type { CollectionSearchParams } from "../schemas/types";
import { collectionColumns } from "./collections-table/collections-columns";
import { CollectionsDataTable } from "./collections-table/collections-data-table";
import { CollectionsTablePagination } from "./collections-table/collections-table-pagination";
import { CollectionsToolbar } from "./collections-table/collections-toolbar";
import { CollectionsBulkActions } from "./collections-table/collections-bulk-actions";
import { CollectionFormDialog } from "./collection-form-dialog";
import { DeleteCollectionDialog } from "./delete-collection-dialog";

export default function Collections() {
	const { search, page, pageSize } = Route.useSearch();
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
	const openCreateDialog = useCollectionsUIStore((s) => s.openCreateDialog);

	const deferredSearch = useDeferredValue(search);
	const filters = useMemo(
		() => ({ search: deferredSearch, page, pageSize }),
		[deferredSearch, page, pageSize],
	);
	const { data, isLoading, isFetching, isError, refetch } =
		useCollections(filters);

	const isSearching = isPending || deferredSearch !== search || isFetching;

	const collections = data?.data ?? [];
	const totalRows = data?.total ?? 0;

	const updateSearch = useCallback(
		(updates: Partial<CollectionSearchParams>) => {
			startTransition(() => {
				router.navigate({
					to: "/contacts/collections",
					search: (prev) => ({
						...prev,
						...updates,
						page: updates.page ?? 1,
					}),
					replace: true,
					resetScroll: false,
				});
			});
		},
		[router, startTransition],
	);

	const table = useReactTable({
		data: collections,
		columns: collectionColumns,
		getRowId: (row) => row.id,
		pageCount: Math.ceil(totalRows / pageSize) || 1,
		state: {
			pagination: { pageIndex: page - 1, pageSize },
			rowSelection,
		},
		onPaginationChange: (updater) => {
			const next =
				typeof updater === "function"
					? updater({ pageIndex: page - 1, pageSize })
					: updater;
			updateSearch({ page: next.pageIndex + 1, pageSize: next.pageSize });
		},
		onRowSelectionChange: setRowSelection,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
	});

	const selectedIds = Object.keys(rowSelection).filter(
		(id) => rowSelection[id],
	);

	return (
		<div className="space-y-1">
			<PageHeader
				title="Collections"
				description="Organize contacts into groups for targeted campaigns."
				actions={
					<Button onClick={openCreateDialog}>
						<FolderPlus className="mr-1 h-4 w-4" />
						New Collection
					</Button>
				}
			/>

			<CollectionFormDialog />
			<DeleteCollectionDialog />

			<div className="flex items-center justify-between gap-3">
				<CollectionsToolbar
					search={search}
					onSearchChange={(s) => updateSearch({ search: s })}
				/>
				<CollectionsBulkActions
					selectedIds={selectedIds}
					onClearSelection={() => setRowSelection({})}
				/>
			</div>

			{isLoading && !data ? (
				<LoadingState message="Loading collections..." />
			) : isError ? (
				<ErrorState
					message="Failed to load collections. Please try again."
					onRetry={() => refetch()}
				/>
			) : collections.length === 0 && !search ? (
				<EmptyState
					icon={Layers}
					title="No collections yet"
					description="Create your first collection to start organizing contacts."
					actionLabel="New Collection"
					onAction={openCreateDialog}
				/>
			) : (
				<div className={isSearching ? "opacity-60 transition-opacity" : ""}>
					<CollectionsDataTable table={table} />
					<CollectionsTablePagination
						table={table}
						totalRows={totalRows}
						onPageSizeChange={(size) => updateSearch({ pageSize: size })}
					/>
				</div>
			)}
		</div>
	);
}
