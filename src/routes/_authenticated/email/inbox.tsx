import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const Inbox = lazy(() => import("@/features/email/components/inbox"));
export const Route = createFileRoute("/_authenticated/email/inbox")({
	component: InboxPage,
});

function InboxPage() {
	return <Inbox />;
}
