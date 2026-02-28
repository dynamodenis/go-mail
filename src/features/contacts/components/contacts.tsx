import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Route } from "@/routes/_authenticated/contacts/index";
import { useNavigate } from "@tanstack/react-router";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import type { Contact, ContactSearchParams, ContactStatus } from "../types";
import { ContactsTablePagination } from "./contacts-table/contacts-table-pagination";
import { contactColumns } from "./contacts-table/contacts-columns";
import { ContactsDataTable } from "./contacts-table/contacts-data-table";
import { ContactsToolbar } from "./contacts-table/contacts-toolbar";

// TODO: Replace with React Query hook — e.g. useContacts(searchParams)
const data: Contact[] = [];
const totalRows = 0;

export default function Contacts() {
	const { search, status, page, pageSize } = Route.useSearch();
	const navigate = useNavigate();
	const [rowSelection, setRowSelection] = useState({});

	const updateSearch = useCallback(
		(updates: Partial<ContactSearchParams>) => {
			navigate({
				to: "/contacts",
				search: (prev) => ({
					...prev,
					...updates,
					page: updates.page ?? 1,
				}),
			});
		},
		[navigate],
	);

	const handleFilterChange = useCallback(
		(filters: { search?: string; status?: ContactStatus | undefined }) => {
			updateSearch(filters);
		},
		[updateSearch],
	);

	const table = useReactTable({
		data,
		columns: contactColumns,
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

	return (
		<div className="space-y-4">
			<PageHeader
				title="Contacts"
				description="Manage your email contacts and subscribers."
				actions={
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Add Contact
					</Button>
				}
			/>
			<ContactsToolbar
				search={search}
				status={status}
				onFilterChange={handleFilterChange}
			/>
			<ContactsDataTable table={table} />
			<ContactsTablePagination
				table={table}
				totalRows={totalRows}
				onPageSizeChange={(size) => updateSearch({ pageSize: size })}
			/>
		</div>
	);
}
