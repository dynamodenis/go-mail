import { useCallback, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import type {
	Template,
	TemplateCategory,
	TemplateAttachment,
	TemplateMergeTag,
} from "../types";
import { useRemoveAttachment } from "../api/queries";
import { TemplateNameInput } from "./template-name-input";
import { TemplateSubjectInput } from "./template-subject-input";
import { TemplateCategorySelect } from "./template-category-select";
import { MergeTagPanel } from "./merge-tag-panel";
import { TemplateBodyEditor } from "./template-body-editor";
import { TemplateAttachmentPanel } from "./template-attachment-panel";

interface TemplateEditorFormProps {
	initialData?: Template;
	onSave: (data: {
		name: string;
		subject: string;
		bodyHtml: string;
		bodyJson: Record<string, NonNullable<unknown>>;
		category: TemplateCategory;
	}) => void;
	isSaving: boolean;
	mode: "create" | "edit";
}

export function TemplateEditorForm({
	initialData,
	onSave,
	isSaving,
	mode,
}: TemplateEditorFormProps) {
	const [name, setName] = useState(initialData?.name ?? "");
	const [subject, setSubject] = useState(initialData?.subject ?? "");
	const [category, setCategory] = useState<TemplateCategory>(
		initialData?.category ?? "PROMOTIONAL",
	);
	const editorRef = useRef<Editor | null>(null);
	const contentSetRef = useRef(false);
	const removeAttachmentMutation = useRemoveAttachment();

	const handleEditorReady = useCallback(
		(editor: Editor) => {
			editorRef.current = editor;
			if (initialData?.bodyHtml && !contentSetRef.current) {
				editor.commands.setContent(initialData.bodyHtml);
				contentSetRef.current = true;
			}
		},
		[initialData?.bodyHtml],
	);

	const handleSave = () => {
		const editor = editorRef.current;
		if (!editor) return;

		const bodyHtml = editor.getHTML();
		const bodyJson = editor.getJSON() as Record<string, NonNullable<unknown>>;

		if (!name.trim() || !subject.trim() || !bodyHtml.trim()) return;

		onSave({ name: name.trim(), subject: subject.trim(), bodyHtml, bodyJson, category });
	};

	const isValid = name.trim() && subject.trim();

	return (
		<div className="flex flex-col gap-4 sm:gap-6 md:flex-row">
			<div className="flex flex-1 flex-col gap-3 sm:gap-4 md:w-3/4">
				<TemplateNameInput value={name} onChange={setName} />
				<TemplateSubjectInput value={subject} onChange={setSubject} />
				<TemplateBodyEditor
					onEditorReady={handleEditorReady}
				/>
			</div>
			<div className="flex flex-col gap-3 sm:gap-4 md:w-1/4">
				<TemplateCategorySelect value={category} onChange={setCategory} />
				<MergeTagPanel
					editor={editorRef.current}
					templateId={initialData?.id}
					savedMergeTags={initialData?.mergeTags}
				/>
				<TemplateAttachmentPanel
					templateId={initialData?.id}
					attachments={initialData?.attachments ?? []}
					onRemove={(id) => removeAttachmentMutation.mutate(id)}
				/>
				<div className="flex flex-col gap-2">
					<Button
						className="w-full"
						onClick={handleSave}
						disabled={isSaving || !isValid}
					>
						{isSaving
							? "Saving..."
							: mode === "create"
								? "Create Template"
								: "Save Changes"}
					</Button>
				</div>
			</div>
		</div>
	);
}
