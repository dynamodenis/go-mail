import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const Integrations = lazy(() => import("@/features/settings/components/Integrations"));
export const Route = createFileRoute("/_authenticated/settings/integrations")({
	component: IntegrationsPage,
});

function IntegrationsPage() {
	return <Integrations />;
}
