import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
	CAMPAIGN_BUILDER_STEPS,
	useCreateCampaignStore,
} from "@/features/campaigns/api/create-campaign-store";
import { useCreateCampaign } from "@/features/campaigns/api/queries";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { CampaignRecipientsStep } from "./campaign-builder/campaign-recipients-step";
import { CampaignReviewStep } from "./campaign-builder/campaign-review-step";
import { CampaignStepIndicator } from "./campaign-builder/campaign-step-indicator";
import { CampaignTemplateStep } from "./campaign-builder/campaign-template-step";

export default function CreateCampaign() {
	const navigate = useNavigate();
	const createCampaign = useCreateCampaign();

	const state = useCreateCampaignStore();
	const { stepIndex, next, prev, goToStep, reset } = state;
	const isLastStep = stepIndex === CAMPAIGN_BUILDER_STEPS.length - 1;

	// Start every visit with a clean wizard, and clear it again on the way out so
	// a half-filled draft never leaks into the next campaign.
	useEffect(() => {
		reset();
		return () => reset();
	}, [reset]);

	// Each step gates the "Next"/"Create" button on its own required fields.
	const canAdvance = useMemo(() => {
		switch (CAMPAIGN_BUILDER_STEPS[stepIndex]) {
			case "template":
				return (
					state.name.trim().length > 0 &&
					state.subject.trim().length > 0 &&
					state.templateId !== null
				);
			case "recipients":
				return state.collectionId !== null;
			default:
				return true;
		}
	}, [stepIndex, state.name, state.subject, state.templateId, state.collectionId]);

	const handleSubmit = () => {
		if (!state.templateId || !state.collectionId) return;
		createCampaign.mutate(
			{
				name: state.name,
				subject: state.subject,
				templateId: state.templateId,
				collectionId: state.collectionId,
				scheduledAt: state.scheduledAt ?? undefined,
			},
			{
				onSuccess: () => {
					toast.success("Campaign created");
					reset();
					navigate({ to: "/campaigns" });
				},
			},
		);
	};

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			<PageHeader
				title="New campaign"
				description="Pick a template, choose your audience, and review before sending."
			/>

			<CampaignStepIndicator stepIndex={stepIndex} onStepClick={goToStep} />

			<div className="min-h-[18rem]">
				{stepIndex === 0 && <CampaignTemplateStep />}
				{stepIndex === 1 && <CampaignRecipientsStep />}
				{stepIndex === 2 && <CampaignReviewStep />}
			</div>

			<div className="flex items-center justify-between border-t pt-4">
				<Button
					variant="ghost"
					onClick={() =>
						stepIndex === 0 ? navigate({ to: "/campaigns" }) : prev()
					}
					size={"sm"}
				>
					<ArrowLeft className="mr-1 h-4 w-4" />
					{stepIndex === 0 ? "Cancel" : "Back"}
				</Button>

				{isLastStep ? (
					<Button
						onClick={handleSubmit}
						disabled={!canAdvance || createCampaign.isPending}
						size={"sm"}
					>
						{createCampaign.isPending ? "Creating..." : "Create campaign"}
					</Button>
				) : (
					<Button onClick={next} disabled={!canAdvance} size={"sm"}>
						Next
						<ArrowRight className="ml-1 h-4 w-4" />
					</Button>
				)}
			</div>
		</div>
	);
}
