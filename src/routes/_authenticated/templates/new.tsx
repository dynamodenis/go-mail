import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/templates/new")({
	component: CreateTemplatePage,
});

function CreateTemplatePage() {
	return (
		<div>
			<h1 className="text-2xl font-bold">Create Template</h1>
			<p className="mt-2 text-muted-foreground">This page is under construction.</p>
		</div>
	);
}
