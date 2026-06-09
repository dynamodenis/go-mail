import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useCampaign, useDeleteCampaign } from "@/features/campaigns/api/queries";
import { EDITABLE_CAMPAIGN_STATUSES } from "@/features/campaigns/types";
import { Route } from "@/routes/_authenticated/campaigns/$campaignId";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CampaignEditForm } from "./campaign-detail/campaign-edit-form";
import { CampaignMetrics } from "./campaign-detail/campaign-metrics";
import { CampaignOverview } from "./campaign-detail/campaign-overview";

export default function CampaignDetails() {
	const { campaignId } = Route.useParams();
	const navigate = useNavigate();
	const deleteCampaign = useDeleteCampaign();

	const [isEditing, setIsEditing] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);

	const { data: campaign, isLoading, isError, refetch } =
		useCampaign(campaignId);

	if (isLoading) {
		return <LoadingState message="Loading campaign..." />;
	}

	if (isError || !campaign) {
		return (
			<ErrorState
				message="Campaign not found or failed to load."
				onRetry={() => refetch()}
			/>
		);
	}

	const isEditable = EDITABLE_CAMPAIGN_STATUSES.includes(campaign.status);

	const handleDelete = () => {
		deleteCampaign.mutate(campaign.id, {
			onSuccess: () => {
				toast.success("Campaign deleted");
				navigate({ to: "/campaigns" });
			},
		});
	};

	return (
		<div className="space-y-4">
			<PageHeader
				title={campaign.name}
				description={campaign.subject}
				actions={
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => navigate({ to: "/campaigns" })}
						>
							<ArrowLeft className="mr-1 h-4 w-4" />
							Back
						</Button>
						{isEditable && !isEditing && (
							<Button size="sm" onClick={() => setIsEditing(true)}>
								<Pencil className="mr-1 h-4 w-4" />
								Edit
							</Button>
						)}
						<Button
							variant="destructive"
							size="sm"
							onClick={() => setConfirmDelete(true)}
						>
							<Trash2 className="mr-1 h-4 w-4" />
							Delete
						</Button>
					</div>
				}
			/>

			<CampaignMetrics campaign={campaign} />

			{isEditing ? (
				<CampaignEditForm
					campaign={campaign}
					onDone={() => setIsEditing(false)}
				/>
			) : (
				<CampaignOverview campaign={campaign} />
			)}

			<ConfirmDialog
				open={confirmDelete}
				onOpenChange={setConfirmDelete}
				title="Delete campaign?"
				description="This permanently removes the campaign and its send history. This action cannot be undone."
				confirmLabel="Delete"
				variant="destructive"
				onConfirm={handleDelete}
			/>
		</div>
	);
}
