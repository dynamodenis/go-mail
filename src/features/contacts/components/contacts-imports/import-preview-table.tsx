import { useMemo } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ParsedContactRow } from "@/features/contacts/schemas/types";

const MAX_PREVIEW_ROWS = 50;

interface ImportPreviewTableProps {
	contacts: ParsedContactRow[];
}

export function ImportPreviewTable({ contacts }: ImportPreviewTableProps) {
	const { validCount, errorCount } = useMemo(() => {
		let valid = 0;
		let errors = 0;
		for (const c of contacts) {
			if (c.isValid) valid++;
			else errors++;
		}
		return { validCount: valid, errorCount: errors };
	}, [contacts]);

	const previewRows = contacts.slice(0, MAX_PREVIEW_ROWS);

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-3">
				<Badge variant="outline" className="text-xs">
					<CheckCircle className="mr-1 size-3 text-emerald-500" />
					{validCount} valid
				</Badge>
				{errorCount > 0 && (
					<Badge variant="outline" className="text-xs">
						<XCircle className="mr-1 size-3 text-red-500" />
						{errorCount} errors (will be skipped)
					</Badge>
				)}
				{contacts.length > MAX_PREVIEW_ROWS && (
					<span className="text-xs text-muted-foreground">
						Showing first {MAX_PREVIEW_ROWS} of {contacts.length} rows
					</span>
				)}
			</div>

			<div className="max-h-56 overflow-auto rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-8 text-xs">#</TableHead>
							<TableHead className="text-xs">Email</TableHead>
							<TableHead className="text-xs">First Name</TableHead>
							<TableHead className="text-xs">Last Name</TableHead>
							<TableHead className="text-xs">Phone</TableHead>
							<TableHead className="text-xs">Company</TableHead>
							<TableHead className="text-xs">Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{previewRows.map((contact, i) => (
							<TableRow
								key={`${contact.email}-${i}`}
								className={contact.isValid ? "" : "bg-red-500/5"}
							>
								<TableCell className="text-xs text-muted-foreground">
									{i + 1}
								</TableCell>
								<TableCell className="max-w-[180px] truncate text-xs">
									{contact.email || "—"}
								</TableCell>
								<TableCell className="text-xs">
									{contact.firstName || "—"}
								</TableCell>
								<TableCell className="text-xs">
									{contact.lastName || "—"}
								</TableCell>
								<TableCell className="text-xs">
									{contact.phone || "—"}
								</TableCell>
								<TableCell className="text-xs">
									{contact.company || "—"}
								</TableCell>
								<TableCell>
									{contact.isValid ? (
										<CheckCircle className="size-3.5 text-emerald-500" />
									) : (
										<span className="text-xs text-red-500">
											{contact.error}
										</span>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
