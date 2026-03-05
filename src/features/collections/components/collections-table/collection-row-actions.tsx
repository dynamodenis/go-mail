import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "@tanstack/react-router";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useCollectionsUIStore } from "../../api/store";
import type { Collection } from "../../schemas/types";

interface CollectionRowActionsProps {
	collection: Collection;
}

export function CollectionRowActions({
	collection,
}: CollectionRowActionsProps) {
	const navigate = useNavigate();
	const openDeleteDialog = useCollectionsUIStore((s) => s.openDeleteDialog);
	const openEditDialog = useCollectionsUIStore((s) => s.openEditDialog);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="h-8 w-8 text-xs">
					<MoreHorizontal className="size-4" />
					<span className="sr-only">Open actions</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem
					onClick={() =>
						navigate({
							to: "/contacts/collections/$collectionId",
							params: { collectionId: collection.id },
						})
					}
					className="text-xs"
				>
					<Eye className="size-4" />
					View
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => openEditDialog(collection)} className="text-xs">
					<Pencil className="size-4" />
					Edit
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					variant="destructive"
					onClick={() => openDeleteDialog(collection.id)}
					className="text-xs"
				>
					<Trash2 className="size-4" />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
