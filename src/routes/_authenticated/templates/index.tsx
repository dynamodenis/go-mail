import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const Templates = lazy(() => import("@/features/templates/components/templates"));
export const Route = createFileRoute("/_authenticated/templates/")({
	component: TemplatesPage,
});

function TemplatesPage() {
	return <Templates />;
}
