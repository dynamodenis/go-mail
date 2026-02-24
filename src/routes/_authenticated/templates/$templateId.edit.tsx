import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const EditTemplate = lazy(() => import("@/features/templates/components/edit-template"));
export const Route = createFileRoute("/_authenticated/templates/$templateId/edit")({
	component: EditTemplatePage,
});

function EditTemplatePage() {
	return <EditTemplate />;
}
