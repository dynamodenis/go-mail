import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const Drafts = lazy(() => import("@/features/email/components/drafts"));
export const Route = createFileRoute("/_authenticated/email/drafts")({
	component: DraftsPage,
});

function DraftsPage() {
	return <Drafts />;
}
