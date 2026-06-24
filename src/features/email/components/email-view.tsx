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
	const setPreviewThread = useEmailUIStore((s) => s.setPreviewThread);

	// Switching folders clears the open thread so the reading pane never shows a
	// message that doesn't belong to the folder now in view.
	// biome-ignore lint/correctness/useExhaustiveDependencies: folder changes intentionally reset thread UI state.
	useEffect(() => {
		setSelectedThread(null);
		setPreviewThread(null);
	}, [folder, setSelectedThread, setPreviewThread]);

	return (
		// Clear the hover-preview only when the cursor leaves BOTH panes, so a
		// previewed thread persists while the cursor moves into the reading pane
		// to scroll it. Leaving the whole view reverts to the selected thread.
		<div
			className="flex h-full overflow-hidden md:gap-2"
			onMouseLeave={() => setPreviewThread(null)}
		>
			<ThreadListPanel
				folder={folder}
				className="min-w-0 flex-1 md:flex-[3_1_0]"
			/>
			<ThreadDetailPanel className="hidden min-w-0 md:flex md:flex-[1_1_0]" />
		</div>
	);
}
