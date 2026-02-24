import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const Campaigns = lazy(() => import("@/features/campaigns/components/campaigns"));
export const Route = createFileRoute("/_authenticated/campaigns/")({
	component: CampaignsPage,
});

function CampaignsPage() {
	return <Campaigns />;
}
