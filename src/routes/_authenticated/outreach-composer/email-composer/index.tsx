import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const EmailComposer = lazy(
	() => import("@/features/email-composer/components/email-composer"),
);
export const Route = createFileRoute(
	"/_authenticated/outreach-composer/email-composer/",
)({
	component: EmailComposerPage,
});

function EmailComposerPage() {
	return <EmailComposer />;
}
