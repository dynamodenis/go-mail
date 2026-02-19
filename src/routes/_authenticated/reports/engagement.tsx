import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/reports/engagement")({
	component: EngagementPage,
});

function EngagementPage() {
	return (
		<div>
			<h1 className="text-2xl font-bold">Engagement</h1>
			<p className="mt-2 text-muted-foreground">This page is under construction.</p>
		</div>
	);
}
