import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const Contacts = lazy(() => import("@/features/contacts/components/Contacts"));
export const Route = createFileRoute("/_authenticated/contacts/")({
	component: ContactsPage,
});

function ContactsPage() {
	return <Contacts />;
}
