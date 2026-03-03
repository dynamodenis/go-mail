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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Save, UserPlus, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useContactsUIStore } from "../api/store";
import Loader from "@/components/global/loader";
import type {
	ContactStatus,
	CreateContactInput,
} from "@/features/contacts/schemas/types";
import { useSaveContact, useUpdateContact } from "../api/queries";
import { toast } from "@/components/ui/sooner";

const INITIAL_FORM: CreateContactInput = {
	email: "",
	firstName: "",
	lastName: "",
	phone: "",
	company: "",
	status: "ACTIVE",
};

export function CreateContactDialog() {
	const open = useContactsUIStore((s) => s.contactDialogOpen);
	const editingContact = useContactsUIStore((s) => s.editingContact);
	const closeDialog = useContactsUIStore((s) => s.closeContactDialog);
	const isEditMode = !!editingContact;

	const [form, setForm] = useState<CreateContactInput>(INITIAL_FORM);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const { mutate: saveContact, isPending: isSaving } = useSaveContact();
	const { mutate: updateMutate, isPending: isUpdating } = useUpdateContact();
	const isPending = isSaving || isUpdating;

	useEffect(() => {
		if (editingContact) {
			setForm({
				email: editingContact.email,
				firstName: editingContact.firstName ?? "",
				lastName: editingContact.lastName ?? "",
				phone: editingContact.phone ?? "",
				company: editingContact.company ?? "",
				status: editingContact.status,
			});
		} else {
			setForm(INITIAL_FORM);
		}
		setErrors({});
	}, [editingContact]);

	const updateField = (field: keyof CreateContactInput, value: string) => {
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

		if (!form.email?.trim()) {
			newErrors.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
			newErrors.email = "Invalid email address";
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		if (isEditMode) {
			updateMutate(
				{ id: editingContact.id, ...form },
				{
					onSuccess: () => {
						closeDialog();
						toast.success("Contact updated");
					},
					onError: () => toast.error("Failed to update contact"),
				},
			);
		} else {
			saveContact(form, {
				onSuccess: () => {
					closeDialog();
					toast.success("Contact created");
				},
				onError: () => toast.error("Failed to save contact"),
			});
		}
	};

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) closeDialog();
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="w-full max-w-lg p-0 overflow-hidden sm:rounded-lg">
				<OrbiterBox variant="blue-light-horizontal" borderRadius={8}>
					<div className="flex flex-col bg-background sm:rounded-lg">
						<div className="flex items-center justify-between px-6 py-4">
							<div>
								<DialogTitle className="text-sm font-semibold">
									{isEditMode ? "Edit Contact" : "Create Contact"}
								</DialogTitle>
								<DialogDescription className="text-xs text-muted-foreground">
									{isEditMode
										? "Update the contact details below."
										: "Add a new contact to your mailing list."}
								</DialogDescription>
							</div>
							<DialogClose>
								<Button variant="ghost" size="sm" className="h-7 w-7 p-0">
									<X className="h-4 w-4" />
								</Button>
							</DialogClose>
						</div>
						<Divider variant="blue-light-horizontal" />
						<form onSubmit={handleSubmit} className="space-y-2 p-6">
							<FormField label="Email" required error={errors.email}>
								<Input
									type="email"
									placeholder="john@example.com"
									value={form.email}
									onChange={(e) => updateField("email", e.target.value)}
									className="text-xs placeholder:text-xs"
								/>
							</FormField>
							<div className="grid grid-cols-2 gap-4">
								<FormField label="First Name">
									<Input
										placeholder="John"
										value={form.firstName ?? ""}
										onChange={(e) => updateField("firstName", e.target.value)}
									/>
								</FormField>
								<FormField label="Last Name">
									<Input
										placeholder="Doe"
										value={form.lastName ?? ""}
										onChange={(e) => updateField("lastName", e.target.value)}
									/>
								</FormField>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<FormField label="Phone">
									<Input
										type="tel"
										placeholder="+1 (555) 000-0000"
										value={form.phone ?? ""}
										onChange={(e) => updateField("phone", e.target.value)}
									/>
								</FormField>
								<FormField label="Company">
									<Input
										placeholder="Acme Inc."
										value={form.company ?? ""}
										onChange={(e) => updateField("company", e.target.value)}
									/>
								</FormField>
							</div>
							<FormField label="Status">
								<Select
									value={form.status}
									onValueChange={(value) =>
										updateField("status", value as ContactStatus)
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ACTIVE">Active</SelectItem>
										<SelectItem value="UNSUBSCRIBED">Unsubscribed</SelectItem>
										<SelectItem value="BOUNCED">Bounced</SelectItem>
										<SelectItem value="CLEANED">Cleaned</SelectItem>
									</SelectContent>
								</Select>
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
												<UserPlus className="mr-1 h-4 w-4" />
											)}
											{isEditMode ? "Save Changes" : "Create Contact"}
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
