import { useEffect } from "react";
import { useEmailUIStore } from "../api/store";
import type { EmailFolder } from "../types";
import { ThreadDetailPanel } from "./thread-detail/thread-detail-panel";
import { ThreadListPanel } from "./thread-list/thread-list-panel";

interface EmailViewProps {
	folder: EmailFolder;
}

/** Superhuman-style two-pane email view: a compact thread list on the left and
 *  a reading pane on the right. The folder is driven by the route (inbox / sent
 *  / drafts), each of which renders this with a different `folder`. */
export function EmailView({ folder }: EmailViewProps) {
	const setSelectedThread = useEmailUIStore((s) => s.setSelectedThread);

	// Switching folders clears the open thread so the reading pane never shows a
	// message that doesn't belong to the folder now in view.
	useEffect(() => {
		setSelectedThread(null);
	}, [folder, setSelectedThread]);

	return (
		<div className="flex h-full gap-4 overflow-hidden">
			<ThreadListPanel folder={folder} className="w-[420px] shrink-0" />
			<ThreadDetailPanel className="flex-1" />
		</div>
	);
}
