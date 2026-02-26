import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TemplatePaginationProps {
	page: number;
	pageSize: number;
	total: number;
	onPageChange: (page: number) => void;
}

export function TemplatePagination({
	page,
	pageSize,
	total,
	onPageChange,
}: TemplatePaginationProps) {
	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	if (totalPages <= 1) return null;

	return (
		<div className="flex items-center justify-between pt-4">
			<p className="text-sm text-muted-foreground">
				Page {page} of {totalPages}
			</p>
			<div className="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={page <= 1}
					onClick={() => onPageChange(page - 1)}
				>
					<ChevronLeft className="mr-1 h-4 w-4" />
					Previous
				</Button>
				<Button
					variant="outline"
					size="sm"
					disabled={page >= totalPages}
					onClick={() => onPageChange(page + 1)}
				>
					Next
					<ChevronRight className="ml-1 h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
