import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/templates/$templateId/edit")({
	component: EditTemplatePage,
});

function EditTemplatePage() {
	return (
		<div>
			<h1 className="text-2xl font-bold">Edit Template</h1>
			<p className="mt-2 text-muted-foreground">This page is under construction.</p>
		</div>
	);
}
