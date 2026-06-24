import { ErrorState } from "@/components/shared/error-state";
import { ServerError } from "@/lib/server-result";
import { Navigate } from "@tanstack/react-router";
import { useEmailFolders } from "../api/queries";
import { EMAIL_CONNECT_CODES } from "../types";
import { EmailNotConnected } from "./email-not-connected";

/** Landing route for `/email`. Folders are dynamic, so there's no static
 *  default folder to route to — resolve the mailbox's Inbox (or first folder)
 *  and redirect there. Handles the disconnected / loading / error states the
 *  redirect can't. */
export default function EmailHome() {
	const {
		data: folders,
		isLoading,
		isError,
		error,
		refetch,
	} = useEmailFolders();

	if (isLoading) {
		return (
			<div
				aria-hidden="true"
				className="flex h-full items-center justify-center"
			>
				<div className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
			</div>
		);
	}

	if (isError) {
		if (error instanceof ServerError && EMAIL_CONNECT_CODES.has(error.code)) {
			return <EmailNotConnected />;
		}
		return (
			<ErrorState
				message="Failed to load your mailbox. Please try again."
				onRetry={() => refetch()}
			/>
		);
	}

	const target = folders?.find((f) => f.role === "inbox") ?? folders?.[0];
	if (!target) return <EmailNotConnected />;

	return (
		<Navigate to="/email/$folderId" params={{ folderId: target.id }} replace />
	);
}
