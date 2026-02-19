import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/campaigns/$campaignId")({
	component: CampaignDetailsPage,
});

function CampaignDetailsPage() {
	return (
		<div>
			<h1 className="text-2xl font-bold">Campaign Details</h1>
			<p className="mt-2 text-muted-foreground">This page is under construction.</p>
		</div>
	);
}
