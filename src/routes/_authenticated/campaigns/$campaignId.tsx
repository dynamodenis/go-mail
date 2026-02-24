import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const CampaignDetails = lazy(() => import("@/features/campaigns/components/campaign-details"));
export const Route = createFileRoute("/_authenticated/campaigns/$campaignId")({
	component: CampaignDetailsPage,
});

function CampaignDetailsPage() {
	return <CampaignDetails />;
}
