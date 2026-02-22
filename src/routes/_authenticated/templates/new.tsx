import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const CreateTemplate = lazy(() => import("@/features/templates/components/CreateTemplate"));
export const Route = createFileRoute("/_authenticated/templates/new")({
	component: CreateTemplatePage,
});

function CreateTemplatePage() {
	return <CreateTemplate />;
}
