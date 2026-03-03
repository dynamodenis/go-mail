import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Table } from "@tanstack/react-table";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";
import type { Contact } from "../../schemas/types";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

interface ContactsTablePaginationProps {
	table: Table<Contact>;
	totalRows: number;
	onPageSizeChange: (pageSize: number) => void;
}

export function ContactsTablePagination({
	table,
	totalRows,
	onPageSizeChange,
}: ContactsTablePaginationProps) {
	const selectedCount = table.getFilteredSelectedRowModel().rows.length;
	const pageIndex = table.getState().pagination.pageIndex;
	const pageSize = table.getState().pagination.pageSize;
	const pageCount = table.getPageCount();

	return (
		<div className="flex items-center justify-between py-4">
			<p className="text-xs text-muted-foreground">
				{selectedCount > 0
					? `${selectedCount} of ${totalRows} row(s) selected`
					: `${totalRows} row(s) total`}
			</p>
			<div className="flex items-center gap-4">
				<div className="flex items-center gap-2">
					<p className="text-xs text-muted-foreground">Rows per page</p>
					<Select
						value={String(pageSize)}
						onValueChange={(value) => onPageSizeChange(Number(value))}
					>
						<SelectTrigger className="w-[70px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{PAGE_SIZE_OPTIONS.map((size) => (
								<SelectItem key={size} value={String(size)}>
									{size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<p className="text-xs text-muted-foreground">
					Page {pageIndex + 1} of {pageCount || 1}
				</p>
				<div className="flex items-center gap-1">
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						onClick={() => table.firstPage()}
						disabled={!table.getCanPreviousPage()}
						aria-label="First page"
					>
						<ChevronsLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
						aria-label="Previous page"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
						aria-label="Next page"
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						onClick={() => table.lastPage()}
						disabled={!table.getCanNextPage()}
						aria-label="Last page"
					>
						<ChevronsRight className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
