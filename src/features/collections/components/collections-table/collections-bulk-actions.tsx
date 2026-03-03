import OrbiterBox from "@/components/global/orbiter-box";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";
import Loader from "@/components/global/loader";
import { useDeleteCollections } from "../../api/queries";
import { toast } from "@/components/ui/sooner";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface CollectionsBulkActionsProps {
	selectedIds: string[];
	onClearSelection: () => void;
}

export function CollectionsBulkActions({
	selectedIds,
	onClearSelection,
}: CollectionsBulkActionsProps) {
	const [confirmOpen, setConfirmOpen] = useState(false);
	const { mutate: bulkDelete, isPending } = useDeleteCollections();
	const count = selectedIds.length;

	const handleDelete = () => {
		bulkDelete(selectedIds, {
			onSuccess: () => {
				setConfirmOpen(false);
				onClearSelection();
				toast.success(`${count} collection${count > 1 ? "s" : ""} deleted`);
			},
			onError: () => toast.error("Failed to delete collections"),
		});
	};

	if (count === 0) return null;

	return (
		<>
			<div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2">
				<span className="text-xs font-medium">{count} selected</span>
				<Button
					variant="destructive"
					size="sm"
					onClick={() => setConfirmOpen(true)}
				>
					<Trash2 className="mr-1 h-3.5 w-3.5" />
					Delete
				</Button>
				<Button variant="ghost" size="sm" onClick={onClearSelection}>
					<X className="mr-1 h-3.5 w-3.5" />
					Clear
				</Button>
			</div>

			<Dialog
				open={confirmOpen}
				onOpenChange={(open) => {
					if (!open && !isPending) setConfirmOpen(false);
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
									Delete {count} Collection{count > 1 ? "s" : ""}
								</DialogTitle>
								<DialogDescription className="mt-1 text-xs text-muted-foreground">
									This will permanently delete {count} collection
									{count > 1 ? "s" : ""} and remove all contact associations.
								</DialogDescription>
							</div>
							<div className="flex w-full gap-3 pt-2">
								<Button
									variant="outline"
									className="flex-1"
									onClick={() => setConfirmOpen(false)}
									disabled={isPending}
								>
									Cancel
								</Button>
								<Button
									variant="destructive"
									className="flex-1"
									onClick={handleDelete}
									disabled={isPending}
								>
									{isPending ? (
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
