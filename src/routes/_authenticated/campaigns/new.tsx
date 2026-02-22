import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const CreateCampaign = lazy(() => import("@/features/campaigns/components/CreateCampaign"));
export const Route = createFileRoute("/_authenticated/campaigns/new")({
	component: CreateCampaignPage,
});

function CreateCampaignPage() {
	return <CreateCampaign />;
}
