import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const EmailComposerPage = lazy(
	() => import("@/features/email-composer/components/email-composer-page"),
);
export const Route = createFileRoute(
	"/_authenticated/outreach-composer/email-composer/",
)({
	component: ComposePage,
});

function ComposePage() {
	return <EmailComposerPage />;
}
