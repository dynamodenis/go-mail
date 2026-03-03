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
import { useContactsUIStore } from "../api/store";
import { useDeleteContact } from "../api/queries";
import { toast } from "@/components/ui/sooner";

export function DeleteContactDialog() {
	const deleteContactId = useContactsUIStore((s) => s.deleteContactId);
	const closeDeleteDialog = useContactsUIStore((s) => s.closeDeleteDialog);
	const { mutate: deleteMutate, isPending } = useDeleteContact();

	const handleConfirm = () => {
		if (!deleteContactId) return;
		deleteMutate(deleteContactId, {
			onSuccess: () => {
				closeDeleteDialog();
				toast.success("Contact deleted");
			},
			onError: () => toast.error("Failed to delete contact"),
		});
	};

	return (
		<Dialog
			open={!!deleteContactId}
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
								Delete Contact
							</DialogTitle>
							<DialogDescription className="mt-1 text-xs text-muted-foreground">
								This action cannot be undone. The contact and all associated data
								will be permanently removed.
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
