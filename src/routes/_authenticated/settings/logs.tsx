import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const Logs = lazy(() => import("@/features/settings/components/logs"));
export const Route = createFileRoute("/_authenticated/settings/logs")({
	component: LogsPage,
});

function LogsPage() {
	return <Logs />;
}
