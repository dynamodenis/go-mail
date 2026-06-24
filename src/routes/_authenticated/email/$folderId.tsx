import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const EmailFolderPage = lazy(
	() => import("@/features/email/components/email-folder-page"),
);

export const Route = createFileRoute("/_authenticated/email/$folderId")({
	component: EmailFolderRoute,
});

function EmailFolderRoute() {
	const { folderId } = Route.useParams();
	return <EmailFolderPage folderId={folderId} />;
}
