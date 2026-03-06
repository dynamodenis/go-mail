import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Plus, Save, MessageSquareIcon, XIcon } from "lucide-react";
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
						<Button
							variant="outline"
							className="w-full"
							onClick={() => setShowComments((prev) => !prev)}
						>
							<MessageSquareIcon className="mr-1 h-4 w-4" />
							{showComments ? "Hide Comments" : "Comments"}
						</Button>
					</div>
				</div>

				{/* Comments slide-over panel — overlays from right, doesn't compress form */}
				{showComments && (
					<>
						<div
							className="fixed inset-0 z-40 bg-black/20"
							onClick={() => setShowComments(false)}
							onKeyDown={() => {}}
							role="presentation"
						/>
						<div className="fixed right-0 top-0 z-50 flex h-full w-[320px] flex-col border-l bg-background shadow-xl">
							<div className="flex items-center justify-between border-b px-4 py-3">
								<div className="flex items-center gap-2">
									<MessageSquareIcon className="size-4 text-primary" />
									<span className="text-sm font-medium">Template Comments</span>
								</div>
								<Button
									variant="ghost"
									size="sm"
									className="h-7 w-7 p-0"
									onClick={() => setShowComments(false)}
								>
									<XIcon className="size-4" />
								</Button>
							</div>
							<div className="flex-1 overflow-y-auto p-4">
								<div className="flex flex-col items-center justify-center h-full text-center">
									<MessageSquareIcon className="size-8 text-muted-foreground/30 mb-3" />
									<p className="text-xs text-muted-foreground">No comments yet</p>
									<p className="text-[10px] text-muted-foreground/60 mt-1">
										Leave comments to collaborate with your team on this template.
									</p>
								</div>
							</div>
							<div className="border-t p-3">
								<div className="flex items-end gap-2">
									<textarea
										placeholder="Add a comment..."
										rows={2}
										className="flex-1 resize-none rounded-md border bg-transparent px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
									/>
									<Button size="sm" className="h-8 shrink-0">
										Post
									</Button>
								</div>
							</div>
						</div>
					</>
				)}
			</div>
		);
	},
);
