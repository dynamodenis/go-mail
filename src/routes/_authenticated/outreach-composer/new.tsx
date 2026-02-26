import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const CreateTemplate = lazy(
	() => import("@/features/email-outreach/components/create-template"),
);
export const Route = createFileRoute("/_authenticated/outreach-composer/new")({
	component: CreateTemplatePage,
});

function CreateTemplatePage() {
	return <CreateTemplate />;
}
