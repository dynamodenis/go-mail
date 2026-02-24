import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const Reports = lazy(() => import("@/features/reports/components/reports"));
export const Route = createFileRoute("/_authenticated/reports/")({
	component: ReportsPage,
});

function ReportsPage() {
	return <Reports />;
}
