import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Plus, Save } from "lucide-react";
import type {
	Template,
	TemplateCategory,
} from "../../types";
import { useRemoveAttachment } from "../../api/queries";
import { TemplateNameInput } from "./template-name-input";
import { TemplateSubjectInput } from "./template-subject-input";
import { TemplateCategorySelect } from "./template-category-select";
import { MergeTagPanel } from "./merge-tag-panel";
import { TemplateBodyEditor } from "./template-body-editor";
import { TemplateAttachmentPanel } from "./template-attachment-panel";
import Loader from "@/components/global/loader";

export interface TemplateEditorFormHandle {
	save: () => void;
	isValid: boolean;
}

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

export const TemplateEditorForm = forwardRef<TemplateEditorFormHandle, TemplateEditorFormProps>(
	function TemplateEditorForm({ initialData, onSave, isSaving, mode }, ref) {
		const [name, setName] = useState(initialData?.name ?? "");
		const [subject, setSubject] = useState(initialData?.subject ?? "");
		const [category, setCategory] = useState<TemplateCategory>(
			initialData?.category ?? "PROMOTIONAL",
		);
		const [showComments, setShowComments] = useState(false);
		const [editor, setEditor] = useState<Editor | null>(null);
		const contentSetRef = useRef(false);
		const removeAttachmentMutation = useRemoveAttachment();

		const isValid = !!(name.trim() && subject.trim());

		const handleEditorReady = useCallback(
			(editorInstance: Editor) => {
				setEditor(editorInstance);
				if (initialData?.bodyHtml && !contentSetRef.current) {
					editorInstance.commands.setContent(initialData.bodyHtml);
					contentSetRef.current = true;
				}
			},
			[initialData?.bodyHtml],
		);

		const handleSave = useCallback(() => {
			if (!editor) return;

			const bodyHtml = editor.getHTML();
			const bodyJson = editor.getJSON() as Record<string, NonNullable<unknown>>;

			if (!name.trim() || !subject.trim() || !bodyHtml.trim()) return;

			onSave({ name: name.trim(), subject: subject.trim(), bodyHtml, bodyJson, category });
		}, [editor, name, subject, category, onSave]);

		useImperativeHandle(ref, () => ({
			save: handleSave,
			isValid,
		}), [handleSave, isValid]);

		return (
			<div className="flex flex-col gap-4 sm:gap-6 md:flex-row">
				<div className="flex flex-1 flex-col gap-3 sm:gap-4 md:w-3/4">
					<TemplateNameInput value={name} onChange={setName} />
					<TemplateSubjectInput value={subject} onChange={setSubject} />
					<TemplateBodyEditor
						onEditorReady={handleEditorReady}
						showComments={showComments}
					/>
				</div>
				<div className="flex flex-col gap-3 sm:gap-4 md:w-1/4">
					<TemplateCategorySelect value={category} onChange={setCategory} />
					<MergeTagPanel
						editor={editor}
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
								? <><Loader size={20}/> Saving...</>
								: mode === "create"
									? <><Plus className="mr-1 h-4 w-4" /> Create Template</>
									: <><Save className="mr-1 h-4 w-4" /> Update Changes</>}
						</Button>
					</div>
				</div>
			</div>
		);
	},
);
