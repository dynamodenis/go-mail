import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const Dashboard = lazy(() => import("@/features/dashboard/components/Dashboard"));
export const Route = createFileRoute("/_authenticated/dashboard")({
	component: DashboardPage,
});

function DashboardPage() {
	return <Dashboard />;
}
