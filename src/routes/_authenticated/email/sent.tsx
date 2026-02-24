import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const Sent = lazy(() => import("@/features/email/components/sent"));
export const Route = createFileRoute("/_authenticated/email/sent")({
	component: SentPage,
});

function SentPage() {
	return <Sent />;
}
