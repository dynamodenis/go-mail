import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const ContactDetails = lazy(() => import("@/features/contacts/components/contact-details"));
export const Route = createFileRoute("/_authenticated/contacts/$contactId")({
	component: ContactDetailsPage,
});

function ContactDetailsPage() {
	return <ContactDetails />;
}
