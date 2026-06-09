import { campaignSearchSchema } from "@/features/campaigns/types";
import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { lazy } from "react";

const Campaigns = lazy(
	() => import("@/features/campaigns/components/campaigns"),
);

export const Route = createFileRoute("/_authenticated/campaigns/")({
	validateSearch: zodValidator(campaignSearchSchema),
	component: CampaignsPage,
});

function CampaignsPage() {
	return <Campaigns />;
}
