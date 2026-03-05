import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { lazy } from "react";
import { collectionDetailSearchSchema } from "@/features/collections/schemas/types";

const CollectionDetail = lazy(
	() => import("@/features/collections/components/collection-detail"),
);

export const Route = createFileRoute(
	"/_authenticated/contacts/collections/$collectionId",
)({
	validateSearch: zodValidator(collectionDetailSearchSchema),
	component: CollectionDetailPage,
});

function CollectionDetailPage() {
	return <CollectionDetail />;
}
