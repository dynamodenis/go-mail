import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const Compliance = lazy(() => import("@/features/settings/components/Compliance"));
export const Route = createFileRoute("/_authenticated/settings/compliance")({
	component: CompliancePage,
});

function CompliancePage() {
	return <Compliance />;
}
