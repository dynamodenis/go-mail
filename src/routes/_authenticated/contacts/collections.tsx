import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const Collections = lazy(() => import("@/features/collections/components/collections"));
export const Route = createFileRoute("/_authenticated/contacts/collections")({
	component: CollectionsPage,
});

function CollectionsPage() {
	return <Collections />;
}
