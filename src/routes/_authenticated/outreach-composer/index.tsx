import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const Templates = lazy(
	() => import("@/features/email-outreach/components/templates"),
);
export const Route = createFileRoute("/_authenticated/outreach-composer/")({
	component: TemplatesPage,
});

function TemplatesPage() {
	return <Templates />;
}
