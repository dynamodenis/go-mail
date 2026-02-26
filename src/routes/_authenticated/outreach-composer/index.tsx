import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/outreach-composer/")({
	beforeLoad: () => {
		throw redirect({ to: "/outreach-composer/email-templates" });
	},
});
