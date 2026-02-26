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
}

export function TemplateBodyEditor({
	onEditorReady,
	onChange,
}: TemplateBodyEditorProps) {
	const handleEditorReady = useCallback(
		(editor: Editor) => {
			onEditorReady(editor);
		},
		[onEditorReady],
	);

	return (
		<div className="min-h-[400px] rounded-md border">
			<NotionEditor
				room=""
				user={LOCAL_USER}
				showTitle={false}
				showComments={false}
				additionalExtensions={MERGE_TAG_EXTENSIONS}
				onEditorReady={handleEditorReady}
				onChange={onChange}
				paragraphPlaceholder="Start writing your email..."
			/>
		</div>
	);
}
