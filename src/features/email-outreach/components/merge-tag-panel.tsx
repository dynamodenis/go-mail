import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	AVAILABLE_MERGE_TAGS,
	type MergeTagDefinition,
	type TemplateMergeTag,
} from "../types";
import { useTemplatesUIStore } from "../api/store";
import { useAddMergeTag, useRemoveMergeTag } from "../api/queries";
import { AddCustomMergeTag } from "./add-custom-merge-tag";

interface MergeTagPanelProps {
	editor: Editor | null;
	templateId?: string;
	savedMergeTags?: TemplateMergeTag[];
}

export function MergeTagPanel({
	editor,
	templateId,
	savedMergeTags = [],
}: MergeTagPanelProps) {
	const [showAddForm, setShowAddForm] = useState(false);
	const { pendingMergeTags, addPendingMergeTag, removePendingMergeTag } =
		useTemplatesUIStore();
	const addMutation = useAddMergeTag();
	const removeMutation = useRemoveMergeTag();

	const isCreateMode = !templateId;
	const customTags: MergeTagDefinition[] = isCreateMode
		? pendingMergeTags
		: savedMergeTags.map((t) => ({ label: t.label, value: t.value }));

	const allTagValues = [
		...AVAILABLE_MERGE_TAGS.map((t) => t.value),
		...customTags.map((t) => t.value),
	];

	const handleInsert = (label: string, value: string) => {
		if (!editor) return;
		editor.chain().focus().insertMergeTag({ label, value }).run();
	};

	const handleAddCustomTag = (tag: MergeTagDefinition) => {
		if (isCreateMode) {
			addPendingMergeTag(tag);
		} else if (templateId) {
			addMutation.mutate({
				templateId,
				label: tag.label,
				value: tag.value,
			});
		}
		setShowAddForm(false);
	};

	const handleRemoveCustomTag = (tag: MergeTagDefinition) => {
		if (isCreateMode) {
			removePendingMergeTag(tag.value);
		} else {
			const saved = savedMergeTags.find((t) => t.value === tag.value);
			if (saved) {
				removeMutation.mutate(saved.id);
			}
		}
	};

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-sm">Merge Tags</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-1.5">
				{AVAILABLE_MERGE_TAGS.map((tag) => (
					<Button
						key={tag.value}
						variant="ghost"
						size="sm"
						className="justify-start font-mono text-xs"
						disabled={!editor}
						onClick={() => handleInsert(tag.label, tag.value)}
					>
						{tag.label}
					</Button>
				))}

				{customTags.length > 0 && (
					<div className="mt-2 border-t pt-2">
						<p className="mb-1 text-xs font-medium text-muted-foreground">
							Custom Tags
						</p>
						{customTags.map((tag) => (
							<div key={tag.value} className="flex items-center gap-1">
								<Button
									variant="ghost"
									size="sm"
									className="flex-1 justify-start font-mono text-xs"
									disabled={!editor}
									onClick={() => handleInsert(tag.label, tag.value)}
								>
									{tag.label}
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
									onClick={() => handleRemoveCustomTag(tag)}
								>
									<X className="h-3 w-3" />
								</Button>
							</div>
						))}
					</div>
				)}

				{showAddForm ? (
					<AddCustomMergeTag
						existingValues={allTagValues}
						onAdd={handleAddCustomTag}
						onCancel={() => setShowAddForm(false)}
					/>
				) : (
					<Button
						variant="outline"
						size="sm"
						className="mt-2 text-xs"
						onClick={() => setShowAddForm(true)}
					>
						<Plus className="mr-1 h-3 w-3" />
						Add Custom Tag
					</Button>
				)}
			</CardContent>
		</Card>
	);
}
