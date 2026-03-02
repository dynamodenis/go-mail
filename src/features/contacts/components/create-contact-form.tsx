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
import { X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useContactsUIStore } from "../api/store";
import Loader from "@/components/global/loader";
import type { ContactStatus, CreateContactInput } from "@/features/contacts/schemas/types";

import { useSaveContact } from "../api/queries";
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
	const open = useContactsUIStore((s) => s.createContactOpen);
	const setOpen = useContactsUIStore((s) => s.setCreateContactOpen);
	const [form, setForm] = useState<CreateContactInput>(INITIAL_FORM);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const {mutate: saveContact, isPending: isSaving} = useSaveContact();

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

		saveContact(form, {
			onSuccess: () => {
				setForm(INITIAL_FORM);
				setErrors({});
				setOpen(false);
				toast.success("Contact created");
			},
			onError: (error) => {
				console.error("Failed to save contact:", error);
				toast.error("Failed to save contact");
			},
		});
	};

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		if (!nextOpen) {
			setForm(INITIAL_FORM);
			setErrors({});
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="w-full max-w-lg p-0 overflow-hidden sm:rounded-lg">
				<OrbiterBox variant="blue-light-horizontal" borderRadius={8}>
					<div className="flex flex-col bg-background sm:rounded-lg">
						<div className="flex items-center justify-between px-6 py-4">
							<div>
								<DialogTitle className="text-lg font-semibold">
									Create Contact
								</DialogTitle>
								<DialogDescription className="text-sm text-muted-foreground">
									Add a new contact to your mailing list.
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
							<FormField label="Email" required error={errors.email}>
								<Input
									type="email"
									placeholder="john@example.com"
									value={form.email}
									onChange={(e) => updateField("email", e.target.value)}
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
								<Button type="submit" disabled={isSaving}>
									{isSaving ? <><Loader size={20} /> Creating...</> : "Create Contact"}
								</Button>
							</div>
						</form>
					</div>
				</OrbiterBox>
			</DialogContent>
		</Dialog>
	);
}
