import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useDeleteCampaign } from "../api/queries";
import { useCampaignsUIStore } from "../api/store";

export function DeleteCampaignDialog() {
	const deleteDialogId = useCampaignsUIStore((s) => s.deleteDialogId);
	const closeDeleteDialog = useCampaignsUIStore((s) => s.closeDeleteDialog);
	const deleteCampaign = useDeleteCampaign();

	return (
		<ConfirmDialog
			open={deleteDialogId !== null}
			onOpenChange={(open) => {
				if (!open) closeDeleteDialog();
			}}
			title="Delete campaign?"
			description="This permanently removes the campaign and its send history. This action cannot be undone."
			confirmLabel="Delete"
			variant="destructive"
			onConfirm={() => {
				if (deleteDialogId) deleteCampaign.mutate(deleteDialogId);
			}}
		/>
	);
}
