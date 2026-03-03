import { Checkbox } from "@/components/ui/checkbox";
import type { ColumnDef } from "@tanstack/react-table";
import type { Collection } from "../../schemas/types";
import { CollectionRowActions } from "./collection-row-actions";
import { Users } from "lucide-react";

export const collectionColumns: ColumnDef<Collection>[] = [
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
		cell: ({ row }) => (
			<div className="flex items-center gap-2">
				<span
					className="h-3 w-3 shrink-0 rounded-full"
					style={{ backgroundColor: row.original.color }}
				/>
				<span className="font-medium">{row.original.name}</span>
			</div>
		),
	},
	{
		accessorKey: "description",
		header: "Description",
		cell: ({ row }) => (
			<span className="text-muted-foreground truncate max-w-[300px] inline-block">
				{row.original.description || (
					<span className="italic">No description</span>
				)}
			</span>
		),
	},
	{
		id: "contactCount",
		header: "Contacts",
		cell: ({ row }) => (
			<div className="flex items-center gap-1 text-muted-foreground">
				<Users className="h-3 w-3" />
				{row.original.contactCount}
			</div>
		),
		size: 100,
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
		cell: ({ row }) => <CollectionRowActions collection={row.original} />,
		size: 40,
	},
];
