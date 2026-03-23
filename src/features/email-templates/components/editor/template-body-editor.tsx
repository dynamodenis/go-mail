import { useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { NotionEditor, MergeTag } from "@/features/tiptap-editor";

const LOCAL_USER = {
	id: "local",
	name: "",
	avatar: "",
	color: "#000",
};

const MERGE_TAG_EXTENSIONS = [MergeTag];

interface TemplateBodyEditorProps {
	onEditorReady: (editor: Editor) => void;
	onChange?: (html: string) => void;
	showComments?: boolean;
	/** Tiptap collaboration room ID — uses template's tiptapReference */
	room?: string;
}

// Format date as "February 02, 2026 at 11:40 am"
function formatNoteDate(timestamp: number): string {
	const date = new Date(timestamp);
	const monthNames = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
	const month = monthNames[date.getMonth()];
	const day = String(date.getDate()).padStart(2, "0");
	const year = date.getFullYear();
	let hours = date.getHours();
	const minutes = String(date.getMinutes()).padStart(2, "0");
	const ampm = hours >= 12 ? "pm" : "am";
	hours = hours % 12;
	hours = hours ? hours : 12; // 0 should be 12

	return `${month} ${day}, ${year} at ${hours}:${minutes} ${ampm}`;
}

export function TemplateBodyEditor({
	onEditorReady,
	onChange,
	showComments = false,
	room = "",
}: TemplateBodyEditorProps) {
	const handleEditorReady = useCallback(
		(editor: Editor) => {
			onEditorReady(editor);
		},
		[onEditorReady],
	);

	return (
		<div className="flex h-[600px] flex-col rounded-md border bg-muted">
			<div className="template-body-editor" />
			<div className="relative flex min-h-0 flex-1 flex-col rounded-md bg-note-modal-background">
				{/* Date display at top of editor */}
				<div className="sticky top-0 z-10 py-2 text-center text-muted-foreground text-sm">
					{formatNoteDate(Date.now())}
				</div>
				<div className="min-h-0 flex-1 overflow-y-auto pl-16 pt-2">
					<NotionEditor
						key={room}
						room={room}
						parentSelector=".template-body-editor"
						user={LOCAL_USER}
						showTitle={false}
						showComments={showComments}
						additionalExtensions={MERGE_TAG_EXTENSIONS}
						onEditorReady={handleEditorReady}
						onChange={onChange}
						paragraphPlaceholder="Start writing your email template here..."
					/>
				</div>
			</div>
		</div>
	);
}
