import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/reports/deliverability")({
	component: DeliverabilityPage,
});

function DeliverabilityPage() {
	return (
		<div>
			<h1 className="text-2xl font-bold">Deliverability</h1>
			<p className="mt-2 text-muted-foreground">This page is under construction.</p>
		</div>
	);
}
