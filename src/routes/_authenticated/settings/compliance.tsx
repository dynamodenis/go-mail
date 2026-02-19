import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/settings/compliance")({
	component: CompliancePage,
});

function CompliancePage() {
	return (
		<div>
			<h1 className="text-2xl font-bold">Compliance</h1>
			<p className="mt-2 text-muted-foreground">This page is under construction.</p>
		</div>
	);
}
