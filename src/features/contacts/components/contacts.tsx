import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Route } from "@/routes/_authenticated/contacts/index";
import { useRouter } from "@tanstack/react-router";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Plus, Upload, Users } from "lucide-react";
import { useCallback, useDeferredValue, useMemo, useState, useTransition } from "react";
import { useContactsUIStore } from "../api/store";
import { useContacts } from "../api/queries";
import type {
	ContactSearchParams,
	ContactStatus,
} from "@/features/contacts/schemas/types";
import { contactColumns } from "./contacts-table/contacts-columns";
import { ContactsDataTable } from "./contacts-table/contacts-data-table";
import { ContactsTablePagination } from "./contacts-table/contacts-table-pagination";
import { ContactsToolbar } from "./contacts-table/contacts-toolbar";
import { ContactsBulkActions } from "./contacts-table/contacts-bulk-actions";
import { CreateContactDialog } from "./create-contact-form";
import { DeleteContactDialog } from "./delete-contact-dialog";
import { ImportContactModal } from "./contacts-imports/import-contact-modal";

export default function Contacts() {
	const { search, status, page, pageSize } = Route.useSearch();
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
	const openCreateDialog = useContactsUIStore((s) => s.openCreateDialog);

	const [openImportModal, setOpenImportModal] = useState(false);

	const deferredSearch = useDeferredValue(search);
	const filters = useMemo(
		() => ({ search: deferredSearch, status, page, pageSize }),
		[deferredSearch, status, page, pageSize],
	);
	const { data, isLoading, isFetching, isError, refetch } = useContacts(filters);
	const isSearching = isPending || deferredSearch !== search || isFetching;

	const contacts = data?.data ?? [];
	const totalRows = data?.total ?? 0;

	const updateSearch = useCallback(
		(updates: Partial<ContactSearchParams>) => {
			startTransition(() => {
				router.navigate({
					to: "/contacts",
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

	return (
		<div className="space-y-1">
			<PageHeader
				title="Contacts"
				description="Manage your email contacts and subscribers."
				actions={
					<><Button onClick={openCreateDialog}>
						<Plus className="mr-1 h-4 w-4" />
						Add Contact
					</Button>
					<Button onClick={() => setOpenImportModal(true)}>
						<Upload className="mr-1 h-4 w-4" />
						Import Contacts
					</Button></>
				}
			/>

			<CreateContactDialog />
			<DeleteContactDialog />
			<ImportContactModal open={openImportModal} onOpenChange={setOpenImportModal} />

			<div className="flex items-center justify-between gap-3">
				<ContactsToolbar
					search={search}
					status={status}
					onFilterChange={handleFilterChange}
				/>
				<ContactsBulkActions
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
					title="No contacts yet"
					description="Add your first contact to get started with your email campaigns."
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
