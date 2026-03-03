import OrbiterBox from "@/components/global/orbiter-box";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Trash2 } from "lucide-react";
import Loader from "@/components/global/loader";
import { useCollectionsUIStore } from "../api/store";
import { useDeleteCollection } from "../api/queries";
import { toast } from "@/components/ui/sooner";

export function DeleteCollectionDialog() {
	const deleteCollectionId = useCollectionsUIStore(
		(s) => s.deleteCollectionId,
	);
	const closeDeleteDialog = useCollectionsUIStore((s) => s.closeDeleteDialog);
	const { mutate: deleteMutate, isPending } = useDeleteCollection();

	const handleConfirm = () => {
		if (!deleteCollectionId) return;
		deleteMutate(deleteCollectionId, {
			onSuccess: () => {
				closeDeleteDialog();
				toast.success("Collection deleted");
			},
			onError: () => toast.error("Failed to delete collection"),
		});
	};

	return (
		<Dialog
			open={!!deleteCollectionId}
			onOpenChange={(open) => {
				if (!open && !isPending) closeDeleteDialog();
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
								Delete Collection
							</DialogTitle>
							<DialogDescription className="mt-1 text-xs text-muted-foreground">
								This will permanently delete this collection. Contacts in the
								collection will not be deleted.
							</DialogDescription>
						</div>
						<div className="flex w-full gap-3 pt-2">
							<Button
								variant="outline"
								className="flex-1"
								onClick={closeDeleteDialog}
								disabled={isPending}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								className="flex-1"
								onClick={handleConfirm}
								disabled={isPending}
							>
								{isPending ? (
									<>
										<Loader size={20} /> Deleting...
									</>
								) : (
									<>
										<Trash2 className="mr-1 h-4 w-4" /> Delete
									</>
								)}
							</Button>
						</div>
					</div>
				</OrbiterBox>
			</DialogContent>
		</Dialog>
	);
}
