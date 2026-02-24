import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const Engagement = lazy(() => import("@/features/reports/components/engagement"));
export const Route = createFileRoute("/_authenticated/reports/engagement")({
	component: EngagementPage,
});

function EngagementPage() {
	return <Engagement />;
}
