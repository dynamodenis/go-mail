import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const Growth = lazy(() => import("@/features/reports/components/growth"));
export const Route = createFileRoute("/_authenticated/reports/growth")({
	component: GrowthPage,
});

function GrowthPage() {
	return <Growth />;
}
