import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const Templates = lazy(
	() => import("@/features/email-templates/components/list/templates"),
);
export const Route = createFileRoute(
	"/_authenticated/outreach-composer/email-templates/",
)({
	component: TemplatesPage,
});

function TemplatesPage() {
	return <Templates />;
}
