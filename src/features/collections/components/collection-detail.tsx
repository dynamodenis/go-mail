import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useContactsUIStore } from "@/features/contacts/api/store";
import { ImportContactModal } from "@/features/contacts/components/contacts-imports/import-contact-modal";
import { contactColumns } from "@/features/contacts/components/contacts-table/contacts-columns";
import { ContactsDataTable } from "@/features/contacts/components/contacts-table/contacts-data-table";
import { ContactsTablePagination } from "@/features/contacts/components/contacts-table/contacts-table-pagination";
import { CreateContactDialog } from "@/features/contacts/components/create-contact-form";
import { DeleteContactDialog } from "@/features/contacts/components/delete-contact-dialog";
import type { ContactStatus } from "@/features/contacts/schemas/types";
import { Route } from "@/routes/_authenticated/contacts/collections/$collectionId";
import { useRouter } from "@tanstack/react-router";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { ArrowLeft, Plus, Upload, Users } from "lucide-react";
import {
	useCallback,
	useDeferredValue,
	useMemo,
	useState,
	useTransition,
} from "react";
import { useCollectionContacts, useCollectionDetail } from "../api/queries";
import type { CollectionDetailSearchParams } from "../schemas/types";
import { CollectionDetailBulkActions } from "./collection-details/collection-detail-bulk-actions";
import { CollectionDetailToolbar } from "./collection-details/collection-detail-toolbar";

export default function CollectionDetail() {
	const { collectionId } = Route.useParams();
	const { search, status, page, pageSize } = Route.useSearch();
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
	const openCreateDialog = useContactsUIStore((s) => s.openCreateDialog);
	const [openImportModal, setOpenImportModal] = useState(false);

	const {
		data: collection,
		isLoading: isLoadingCollection,
		isError: isCollectionError,
	} = useCollectionDetail(collectionId);

	const deferredSearch = useDeferredValue(search);
	const filters = useMemo(
		() => ({ search: deferredSearch, status, collectionId, page, pageSize }),
		[deferredSearch, status, collectionId, page, pageSize],
	);
	const { data, isLoading, isFetching, isError, refetch } =
		useCollectionContacts(filters);
	const isSearching = isPending || deferredSearch !== search || isFetching;

	const contacts = data?.data ?? [];
	const totalRows = data?.total ?? 0;

	const updateSearch = useCallback(
		(updates: Partial<CollectionDetailSearchParams>) => {
			startTransition(() => {
				router.navigate({
					to: "/contacts/collections/$collectionId",
					params: { collectionId },
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
		[router, startTransition, collectionId],
	);

	const handleFilterChange = useCallback(
		(f: { search?: string; status?: ContactStatus | undefined }) => {
			updateSearch(f);
		},
		[updateSearch],
	);

	const table = useReactTable({
		data: contacts,
		columns: contactColumns,
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

	if (isLoadingCollection) {
		return <LoadingState message="Loading collection..." />;
	}

	if (isCollectionError || !collection) {
		return (
			<ErrorState
				message="Collection not found or failed to load."
				onRetry={() => router.navigate({ to: "/contacts/collections" })}
			/>
		);
	}

	return (
		<div className="space-y-1">
			<PageHeader
				title={collection.name}
				description={`${collection.contactCount} contact${collection.contactCount !== 1 ? "s" : ""} in this collection`}
				actions={
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => router.navigate({ to: "/contacts/collections" })}
						>
							<ArrowLeft className="mr-1 h-4 w-4" />
							Back
						</Button>
						<Button size="sm" onClick={openCreateDialog}>
							<Plus className="mr-1 h-4 w-4" />
							Add Contact
						</Button>
						<Button size="sm" onClick={() => setOpenImportModal(true)}>
							<Upload className="mr-1 h-4 w-4" />
							Import
						</Button>
					</div>
				}
			/>

			<CreateContactDialog />
			<DeleteContactDialog />
			<ImportContactModal
				open={openImportModal}
				onOpenChange={setOpenImportModal}
			/>

			<div className="flex items-center justify-between gap-3">
				<CollectionDetailToolbar
					search={search}
					status={status}
					onFilterChange={handleFilterChange}
				/>
				<CollectionDetailBulkActions
					collectionId={collectionId}
					selectedIds={selectedIds}
					onClearSelection={() => setRowSelection({})}
				/>
			</div>

			{isLoading && !data ? (
				<LoadingState message="Loading contacts..." />
			) : isError ? (
				<ErrorState
					message="Failed to load contacts. Please try again."
					onRetry={() => refetch()}
				/>
			) : contacts.length === 0 && !search && !status ? (
				<EmptyState
					icon={Users}
					title="No contacts in this collection"
					description="Add contacts or import them to get started."
					actionLabel="Add Contact"
					onAction={openCreateDialog}
				/>
			) : (
				<div className={isSearching ? "opacity-60 transition-opacity" : ""}>
					<ContactsDataTable table={table} />
					<ContactsTablePagination
						table={table}
						totalRows={totalRows}
						onPageSizeChange={(size) => updateSearch({ pageSize: size })}
					/>
				</div>
			)}
		</div>
	);
}
