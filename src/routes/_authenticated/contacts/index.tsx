import { contactSearchSchema } from "@/features/contacts/schemas/types";
import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { lazy } from "react";

const Contacts = lazy(() => import("@/features/contacts/components/contacts"));

export const Route = createFileRoute("/_authenticated/contacts/")({
	validateSearch: zodValidator(contactSearchSchema),
	component: ContactsPage,
});

function ContactsPage() {
	return <Contacts />;
}
