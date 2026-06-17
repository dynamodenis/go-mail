import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { usePrefetchAllData } from "@/hooks/use-prefetch-all-data";
const Dashboard = lazy(() => import("@/features/dashboard/components/dashboard"));
export const Route = createFileRoute("/_authenticated/dashboard")({
	component: DashboardPage,
});

function DashboardPage() {
	// Warm feature caches (inbox threads + top message bodies) in the background
	// so navigating onward feels instant. Client-only, non-blocking.
	usePrefetchAllData();
	return <Dashboard />;
}
