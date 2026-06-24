import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const EmailHome = lazy(() => import("@/features/email/components/email-home"));

export const Route = createFileRoute("/_authenticated/email/")({
	component: EmailHome,
});
