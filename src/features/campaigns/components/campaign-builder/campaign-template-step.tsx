import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useCreateCampaignStore } from "@/features/campaigns/api/create-campaign-store";
import { useTemplates } from "@/features/email-templates/api/queries";
import { TEMPLATE_CATEGORY_LABELS } from "@/features/email-templates/types";
import { FileText } from "lucide-react";

// Pull a generous page so the picker shows the user's templates without its own
// pagination; the list is cached for 5 minutes by useTemplates.
const TEMPLATE_PAGE_SIZE = 100;

export function CampaignTemplateStep() {
	const name = useCreateCampaignStore((s) => s.name);
	const subject = useCreateCampaignStore((s) => s.subject);
	const templateId = useCreateCampaignStore((s) => s.templateId);
	const setField = useCreateCampaignStore((s) => s.setField);

	const { data, isLoading, isError, refetch } = useTemplates({
		page: 1,
		pageSize: TEMPLATE_PAGE_SIZE,
	});
	const templates = data?.data ?? [];

	const handleTemplateChange = (id: string) => {
		setField("templateId", id);
		// Prefill the subject from the template the first time one is chosen, so
		// the user has a sensible default they can still edit.
		if (!subject.trim()) {
			const picked = templates.find((t) => t.id === id);
			if (picked) setField("subject", picked.subject);
		}
	};

	return (
		<div className="space-y-4">
			<FormField label="Campaign name" required className="gap-2">
				<Input
					value={name}
					onChange={(e) => setField("name", e.target.value)}
					placeholder="e.g. June Newsletter"
					maxLength={255}
				/>
			</FormField>

			<FormField label="Subject line" required>
				<Input
					value={subject}
					onChange={(e) => setField("subject", e.target.value)}
					placeholder="What recipients see in their inbox"
					maxLength={255}
				/>
			</FormField>

			<FormField label="Email template" required>
				{isLoading ? (
					<LoadingState message="Loading templates..." />
				) : isError ? (
					<ErrorState
						message="Failed to load templates."
						onRetry={() => refetch()}
					/>
				) : templates.length === 0 ? (
					<EmptyState
						icon={FileText}
						title="No templates yet"
						description="Create an email template first, then come back to launch a campaign."
					/>
				) : (
					<Select
						value={templateId ?? undefined}
						onValueChange={handleTemplateChange}
					>
						<SelectTrigger>
							<SelectValue placeholder="Choose a template" />
						</SelectTrigger>
						<SelectContent>
							{templates.map((template) => (
								<SelectItem key={template.id} value={template.id}>
									{template.name}
									<span className="ml-2 text-muted-foreground">
										{TEMPLATE_CATEGORY_LABELS[template.category]}
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			</FormField>
		</div>
	);
}
