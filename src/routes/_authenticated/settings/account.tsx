import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const AccountSettings = lazy(() => import("@/features/settings/components/AccountSettings"));
export const Route = createFileRoute("/_authenticated/settings/account")({
	component: AccountSettingsPage,
});

function AccountSettingsPage() {
	return <AccountSettings />;
}
