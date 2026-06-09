import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useUpdateCampaign } from "@/features/campaigns/api/queries";
import type {
	CampaignDetail,
	CampaignStatus,
} from "@/features/campaigns/types";
import { useCollections } from "@/features/collections/api/queries";
import { useTemplates } from "@/features/email-templates/api/queries";
import { useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 100;

// Statuses a user may set by hand. SENDING/SENT are driven by the send pipeline,
// so they're not offered here.
const STATUS_OPTIONS: { value: CampaignStatus; label: string }[] = [
	{ value: "DRAFT", label: "Draft" },
	{ value: "SCHEDULED", label: "Scheduled" },
	{ value: "PAUSED", label: "Paused" },
	{ value: "CANCELLED", label: "Cancelled" },
];

// `datetime-local` works in local time without a timezone; the API stores ISO.
function isoToLocalInput(iso: string | null): string {
	if (!iso) return "";
	const d = new Date(iso);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
		d.getHours(),
	)}:${pad(d.getMinutes())}`;
}

interface CampaignEditFormProps {
	campaign: CampaignDetail;
	onDone: () => void;
}

export function CampaignEditForm({ campaign, onDone }: CampaignEditFormProps) {
	const updateCampaign = useUpdateCampaign();
	const [form, setForm] = useState({
		name: campaign.name,
		subject: campaign.subject,
		templateId: campaign.templateId,
		collectionId: campaign.collectionId,
		status: campaign.status,
		scheduledAt: campaign.scheduledAt,
	});

	const { data: templateData } = useTemplates({ page: 1, pageSize: PAGE_SIZE });
	const { data: collectionData } = useCollections({
		search: "",
		page: 1,
		pageSize: PAGE_SIZE,
	});
	const templates = templateData?.data ?? [];
	const collections = collectionData?.data ?? [];

	const update = (patch: Partial<typeof form>) =>
		setForm((f) => ({ ...f, ...patch }));

	const canSave =
		form.name.trim().length > 0 &&
		form.subject.trim().length > 0 &&
		!!form.templateId &&
		!!form.collectionId;

	const handleSave = () => {
		if (!canSave) return;
		updateCampaign.mutate(
			{
				id: campaign.id,
				name: form.name,
				subject: form.subject,
				templateId: form.templateId,
				collectionId: form.collectionId,
				status: form.status,
				scheduledAt: form.scheduledAt ?? null,
			},
			{
				onSuccess: () => {
					toast.success("Campaign updated");
					onDone();
				},
			},
		);
	};

	return (
		<Card>
			<CardContent className="space-y-4 py-4">
				<FormField label="Campaign name" required>
					<Input
						value={form.name}
						onChange={(e) => update({ name: e.target.value })}
						maxLength={255}
					/>
				</FormField>

				<FormField label="Subject line" required>
					<Input
						value={form.subject}
						onChange={(e) => update({ subject: e.target.value })}
						maxLength={255}
					/>
				</FormField>

				<FormField label="Email template" required>
					<Select
						value={form.templateId || undefined}
						onValueChange={(v) => update({ templateId: v })}
					>
						<SelectTrigger>
							<SelectValue placeholder="Choose a template" />
						</SelectTrigger>
						<SelectContent>
							{templates.map((t) => (
								<SelectItem key={t.id} value={t.id}>
									{t.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</FormField>

				<FormField label="Recipient collection" required>
					<Select
						value={form.collectionId || undefined}
						onValueChange={(v) => update({ collectionId: v })}
					>
						<SelectTrigger>
							<SelectValue placeholder="Choose a collection" />
						</SelectTrigger>
						<SelectContent>
							{collections.map((c) => (
								<SelectItem key={c.id} value={c.id}>
									{c.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</FormField>

				<FormField label="Status">
					<Select
						value={form.status}
						onValueChange={(v) => update({ status: v as CampaignStatus })}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{STATUS_OPTIONS.map((s) => (
								<SelectItem key={s.value} value={s.value}>
									{s.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</FormField>

				<FormField label="Schedule send (optional)">
					<Input
						type="datetime-local"
						value={isoToLocalInput(form.scheduledAt)}
						onChange={(e) =>
							update({
								scheduledAt: e.target.value
									? new Date(e.target.value).toISOString()
									: null,
							})
						}
					/>
				</FormField>

				<div className="flex justify-end gap-2 border-t pt-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={onDone}
						disabled={updateCampaign.isPending}
					>
						Cancel
					</Button>
					<Button
						size="sm"
						onClick={handleSave}
						disabled={!canSave || updateCampaign.isPending}
					>
						{updateCampaign.isPending ? "Saving..." : "Save changes"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
