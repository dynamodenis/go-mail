import OrbiterBox from "@/components/global/orbiter-box";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import Divider from "@/components/ui/divider";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { FolderPlus, Save, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useCollectionsUIStore } from "../api/store";
import Loader from "@/components/global/loader";
import type { CreateCollectionInput } from "../schemas/types";
import { DEFAULT_COLLECTION_COLOR } from "../schemas/types";
import { useCreateCollection, useUpdateCollection } from "../api/queries";
import { toast } from "@/components/ui/sooner";
import { CollectionColorPicker } from "./collection-color-picker";

const INITIAL_FORM: CreateCollectionInput = {
	name: "",
	description: "",
	color: DEFAULT_COLLECTION_COLOR,
};

export function CollectionFormDialog() {
	const open = useCollectionsUIStore((s) => s.collectionDialogOpen);
	const editingCollection = useCollectionsUIStore((s) => s.editingCollection);
	const closeDialog = useCollectionsUIStore((s) => s.closeCollectionDialog);
	const isEditMode = !!editingCollection;

	const [form, setForm] = useState<CreateCollectionInput>(INITIAL_FORM);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const { mutate: createMutate, isPending: isCreating } = useCreateCollection();
	const { mutate: updateMutate, isPending: isUpdating } = useUpdateCollection();
	const isPending = isCreating || isUpdating;

	useEffect(() => {
		if (editingCollection) {
			setForm({
				name: editingCollection.name,
				description: editingCollection.description ?? "",
				color: editingCollection.color,
			});
		} else {
			setForm(INITIAL_FORM);
		}
		setErrors({});
	}, [editingCollection]);

	const updateField = (field: keyof CreateCollectionInput, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) {
			setErrors((prev) => {
				const next = { ...prev };
				delete next[field];
				return next;
			});
		}
	};

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		const newErrors: Record<string, string> = {};

		if (!form.name?.trim()) {
			newErrors.name = "Collection name is required";
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		if (isEditMode) {
			updateMutate(
				{ id: editingCollection.id, ...form },
				{
					onSuccess: () => {
						closeDialog();
						toast.success("Collection updated");
					},
					onError: () => toast.error("Failed to update collection"),
				},
			);
		} else {
			createMutate(form, {
				onSuccess: () => {
					closeDialog();
					toast.success("Collection created");
				},
				onError: () => toast.error("Failed to create collection"),
			});
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) closeDialog();
			}}
		>
			<DialogContent className="w-full max-w-lg p-0 overflow-hidden sm:rounded-lg">
				<OrbiterBox variant="blue-light-horizontal" borderRadius={8}>
					<div className="flex flex-col bg-background sm:rounded-lg">
						<div className="flex items-center justify-between px-6 py-4">
							<div>
								<DialogTitle className="text-sm font-semibold">
									{isEditMode ? "Edit Collection" : "Create Collection"}
								</DialogTitle>
								<DialogDescription className="text-xs text-muted-foreground">
									{isEditMode
										? "Update the collection details below."
										: "Create a new collection to organize your contacts."}
								</DialogDescription>
							</div>
							<DialogClose>
								<Button variant="ghost" size="sm" className="h-7 w-7 p-0">
									<X className="h-4 w-4" />
								</Button>
							</DialogClose>
						</div>
						<Divider variant="blue-light-horizontal" />
						<form onSubmit={handleSubmit} className="space-y-4 p-6">
							<FormField label="Name" required error={errors.name}>
								<Input
									placeholder="e.g. Newsletter Subscribers"
									value={form.name}
									onChange={(e) => updateField("name", e.target.value)}
									className="text-xs placeholder:text-xs"
								/>
							</FormField>
							<FormField label="Description">
								<Input
									placeholder="A brief description of this collection"
									value={form.description ?? ""}
									onChange={(e) => updateField("description", e.target.value)}
									className="text-xs placeholder:text-xs"
								/>
							</FormField>
							<FormField label="Color">
								<CollectionColorPicker
									value={form.color ?? DEFAULT_COLLECTION_COLOR}
									onChange={(color) => updateField("color", color)}
								/>
							</FormField>
							<div className="flex justify-end gap-3 pt-2">
								<DialogClose>
									<Button type="button" variant="outline">
										Cancel
									</Button>
								</DialogClose>
								<Button type="submit" disabled={isPending}>
									{isPending ? (
										<>
											<Loader size={20} />{" "}
											{isEditMode ? "Saving..." : "Creating..."}
										</>
									) : (
										<>
											{isEditMode ? (
												<Save className="mr-1 h-4 w-4" />
											) : (
												<FolderPlus className="mr-1 h-4 w-4" />
											)}
											{isEditMode ? "Save Changes" : "Create Collection"}
										</>
									)}
								</Button>
							</div>
						</form>
					</div>
				</OrbiterBox>
			</DialogContent>
		</Dialog>
	);
}
