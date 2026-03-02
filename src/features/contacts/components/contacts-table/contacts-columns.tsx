import { Checkbox } from "@/components/ui/checkbox";
import type { ColumnDef } from "@tanstack/react-table";
import type { Contact } from "../../schemas/types";
import { ContactRowActions } from "./contact-row-actions";
import { ContactStatusBadge } from "./contact-status-badge";

export const contactColumns: ColumnDef<Contact>[] = [
	{
		id: "select",
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && "indeterminate")
				}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Select all"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Select row"
			/>
		),
		enableSorting: false,
		enableHiding: false,
		size: 40,
	},
	{
		id: "name",
		header: "Name",
		cell: ({ row }) => {
			const first = row.original.firstName ?? "";
			const last = row.original.lastName ?? "";
			const fullName = `${first} ${last}`.trim();
			return (
				<span className="font-medium">
					{fullName || (
						<span className="text-muted-foreground italic">No name</span>
					)}
				</span>
			);
		},
	},
	{
		accessorKey: "email",
		header: "Email",
		cell: ({ row }) => (
			<span className="text-muted-foreground">{row.original.email}</span>
		),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => <ContactStatusBadge status={row.original.status} />,
	},
	{
		accessorKey: "createdAt",
		header: "Created",
		cell: ({ row }) => {
			const date = new Date(row.original.createdAt);
			return (
				<span className="text-muted-foreground">
					{date.toLocaleDateString("en-US", {
						month: "short",
						day: "numeric",
						year: "numeric",
					})}
				</span>
			);
		},
	},
	{
		id: "actions",
		header: "",
		cell: ({ row }) => <ContactRowActions contact={row.original} />,
		size: 40,
	},
];
