import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const Team = lazy(() => import("@/features/settings/components/Team"));
export const Route = createFileRoute("/_authenticated/settings/team")({
	component: TeamPage,
});

function TeamPage() {
	return <Team />;
}
