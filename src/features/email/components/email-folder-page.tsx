import { useEmailFolders } from "../api/queries";
import { EmailView } from "./email-view";

interface EmailFolderPageProps {
	folderId: string;
}

/** Resolves a `$folderId` route param to its role from the cached folder list
 *  (warm by the time we get here, via prefetch or the sidebar) and renders the
 *  two-pane view. Falls back to "custom" preview until folders load. */
export default function EmailFolderPage({ folderId }: EmailFolderPageProps) {
	const { data: folders } = useEmailFolders();
	const folderRole = folders?.find((f) => f.id === folderId)?.role ?? "custom";

	return <EmailView folderId={folderId} folderRole={folderRole} />;
}
