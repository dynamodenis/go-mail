import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const Deliverability = lazy(() => import("@/features/reports/components/deliverability"));
export const Route = createFileRoute("/_authenticated/reports/deliverability")({
	component: DeliverabilityPage,
});

function DeliverabilityPage() {
	return <Deliverability />;
}
