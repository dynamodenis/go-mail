import Loader from "@/components/global/loader";
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
import { toast } from "@/components/ui/sooner";
import { FolderPlus, Save, X } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
	useCollectionContactIds,
	useCreateCollection,
	useUpdateCollection,
} from "../api/queries";
import { useCollectionsUIStore } from "../api/store";
import { DEFAULT_COLLECTION_COLOR } from "../schemas/types";
import { CollectionColorPicker } from "./collections-form/collection-color-picker";
import { ContactSearchSelect } from "./collections-form/contact-search-select";

interface CollectionFormState {
	name: string;
	description?: string;
	color: string;
	contactIds: string[];
}

const INITIAL_FORM: CollectionFormState = {
	name: "",
	description: "",
	color: DEFAULT_COLLECTION_COLOR,
	contactIds: [],
};

export function CollectionFormDialog() {
	const open = useCollectionsUIStore((s) => s.collectionDialogOpen);
	const editingCollection = useCollectionsUIStore((s) => s.editingCollection);
	const closeDialog = useCollectionsUIStore((s) => s.closeCollectionDialog);
	const isEditMode = !!editingCollection;

	const [form, setForm] = useState<CollectionFormState>(INITIAL_FORM);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const { mutate: createMutate, isPending: isCreating } = useCreateCollection();
	const { mutate: updateMutate, isPending: isUpdating } = useUpdateCollection();
	const isPending = isCreating || isUpdating;

	const { data: existingContactIds } = useCollectionContactIds(
		editingCollection?.id ?? null,
	);

	useEffect(() => {
		if (editingCollection) {
			setForm({
				name: editingCollection.name,
				description: editingCollection.description ?? "",
				color: editingCollection.color,
				contactIds: [],
			});
		} else {
			setForm(INITIAL_FORM);
		}
		setErrors({});
	}, [editingCollection]);

	useEffect(() => {
		if (existingContactIds?.length) {
			setForm((prev) => ({ ...prev, contactIds: existingContactIds }));
		}
	}, [existingContactIds]);

	const updateField = (field: keyof CollectionFormState, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) {
			setErrors((prev) => {
				const next = { ...prev };
				delete next[field];
				return next;
			});
		}
	};

	const handleContactIdsChange = useCallback((ids: string[]) => {
		setForm((prev) => ({ ...prev, contactIds: ids }));
	}, []);

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

		const { contactIds, ...fields } = form;

		if (isEditMode) {
			updateMutate(
				{ id: editingCollection.id, ...fields, contactIds },
				{
					onSuccess: () => {
						closeDialog();
						toast.success("Collection updated");
					},
					onError: () => toast.error("Failed to update collection"),
				},
			);
		} else {
			createMutate(
				{
					...fields,
					...(contactIds.length > 0 && { contactIds }),
				},
				{
					onSuccess: () => {
						closeDialog();
						toast.success("Collection created");
					},
					onError: () => toast.error("Failed to create collection"),
				},
			);
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
					<div className="flex flex-col bg-background sm:rounded-lg overflow-y-auto max-h-[calc(100vh-60px)] sm:max-h-[calc(95vh-80px)]">
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
							<FormField label="Contacts">
								<ContactSearchSelect
									selectedIds={form.contactIds}
									onChange={handleContactIdsChange}
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
