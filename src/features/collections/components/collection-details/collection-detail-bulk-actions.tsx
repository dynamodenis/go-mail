import Loader from "@/components/global/loader";
import OrbiterBox from "@/components/global/orbiter-box";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sooner";
import { useDeleteContacts } from "@/features/contacts/api/queries";
import { Trash2, UserMinus, X } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useRemoveContactsFromCollection } from "../../api/queries";

interface CollectionDetailBulkActionsProps {
	collectionId: string;
	selectedIds: string[];
	onClearSelection: () => void;
}

export function CollectionDetailBulkActions({
	collectionId,
	selectedIds,
	onClearSelection,
}: CollectionDetailBulkActionsProps) {
	const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const { mutate: removeFromCollection, isPending: isRemoving } =
		useRemoveContactsFromCollection();
	const { mutate: bulkDelete, isPending: isDeleting } = useDeleteContacts();
	const count = selectedIds.length;

	const handleRemove = () => {
		removeFromCollection(
			{ collectionId, contactIds: selectedIds },
			{
				onSuccess: () => {
					setRemoveConfirmOpen(false);
					onClearSelection();
					toast.success(
						`${count} contact${count > 1 ? "s" : ""} removed from collection`,
					);
				},
				onError: () => toast.error("Failed to remove contacts"),
			},
		);
	};

	const handleDelete = () => {
		bulkDelete(selectedIds, {
			onSuccess: () => {
				setDeleteConfirmOpen(false);
				onClearSelection();
				toast.success(`${count} contact${count > 1 ? "s" : ""} deleted`);
			},
			onError: () => toast.error("Failed to delete contacts"),
		});
	};

	if (count === 0) return null;

	return (
		<>
			<div className="flex items-center gap-2 rounded-md border bg-muted/50 px-2 py-0.5">
				<span className="text-xs font-medium">{count} selected</span>
				<Button
					variant="outline"
					size="sm"
					onClick={() => setRemoveConfirmOpen(true)}
					className="h-7"
				>
					<UserMinus className="mr-1 h-3.5 w-3.5" />
					Remove
				</Button>
				<Button
					variant="destructive"
					size="sm"
					onClick={() => setDeleteConfirmOpen(true)}
					className="h-7"
				>
					<Trash2 className="mr-1 h-3.5 w-3.5" />
					Delete
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={onClearSelection}
					className="h-7"
				>
					<X className="mr-1 h-3.5 w-3.5" />
					Clear
				</Button>
			</div>

			<Dialog
				open={removeConfirmOpen}
				onOpenChange={(open) => {
					if (!open && !isRemoving) setRemoveConfirmOpen(false);
				}}
			>
				<DialogContent className="w-full max-w-sm p-0 overflow-hidden sm:rounded-lg">
					<OrbiterBox variant="blue-light-horizontal" borderRadius={8}>
						<div className="flex flex-col items-center gap-4 bg-background p-6 sm:rounded-lg">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
								<UserMinus className="h-6 w-6 text-primary" />
							</div>
							<div className="text-center">
								<DialogTitle className="text-sm font-semibold">
									Remove {count} Contact{count > 1 ? "s" : ""}
								</DialogTitle>
								<DialogDescription className="mt-1 text-xs text-muted-foreground">
									This will remove {count} contact{count > 1 ? "s" : ""} from
									this collection. The contacts will not be deleted.
								</DialogDescription>
							</div>
							<div className="flex w-full gap-3 pt-2">
								<Button
									variant="outline"
									className="flex-1"
									onClick={() => setRemoveConfirmOpen(false)}
									disabled={isRemoving}
								>
									Cancel
								</Button>
								<Button
									className="flex-1"
									onClick={handleRemove}
									disabled={isRemoving}
								>
									{isRemoving ? (
										<>
											<Loader size={20} /> Removing...
										</>
									) : (
										<>
											<UserMinus className="mr-1 h-4 w-4" /> Remove
										</>
									)}
								</Button>
							</div>
						</div>
					</OrbiterBox>
				</DialogContent>
			</Dialog>

			<Dialog
				open={deleteConfirmOpen}
				onOpenChange={(open) => {
					if (!open && !isDeleting) setDeleteConfirmOpen(false);
				}}
			>
				<DialogContent className="w-full max-w-sm p-0 overflow-hidden sm:rounded-lg">
					<OrbiterBox variant="destructive" borderRadius={8}>
						<div className="flex flex-col items-center gap-4 bg-background p-6 sm:rounded-lg">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
								<AlertTriangle className="h-6 w-6 text-destructive" />
							</div>
							<div className="text-center">
								<DialogTitle className="text-sm font-semibold">
									Delete {count} Contact{count > 1 ? "s" : ""}
								</DialogTitle>
								<DialogDescription className="mt-1 text-xs text-muted-foreground">
									This will permanently delete {count} contact
									{count > 1 ? "s" : ""}. This action cannot be undone.
								</DialogDescription>
							</div>
							<div className="flex w-full gap-3 pt-2">
								<Button
									variant="outline"
									className="flex-1"
									onClick={() => setDeleteConfirmOpen(false)}
									disabled={isDeleting}
								>
									Cancel
								</Button>
								<Button
									variant="destructive"
									className="flex-1"
									onClick={handleDelete}
									disabled={isDeleting}
								>
									{isDeleting ? (
										<>
											<Loader size={20} /> Deleting...
										</>
									) : (
										<>
											<Trash2 className="mr-1 h-4 w-4" /> Delete All
										</>
									)}
								</Button>
							</div>
						</div>
					</OrbiterBox>
				</DialogContent>
			</Dialog>
		</>
	);
}
