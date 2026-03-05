import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { lazy } from "react";
import { collectionSearchSchema } from "@/features/collections/schemas/types";

const Collections = lazy(
	() => import("@/features/collections/components/collections"),
);

export const Route = createFileRoute("/_authenticated/contacts/collections/")({
	validateSearch: zodValidator(collectionSearchSchema),
	component: CollectionsPage,
});

function CollectionsPage() {
	return <Collections />;
}
