import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { useCreateTemplate } from "../api/queries";
import { TemplateEditorForm } from "./editor/template-editor-form";

export default function CreateTemplate() {
	const router = useRouter();
	const createMutation = useCreateTemplate();

	return (
		<div>
			<PageHeader
				title="Create Template"
				description="Design a new email template."
			/>
			<TemplateEditorForm
				mode="create"
				isSaving={createMutation.isPending}
				onSave={(data) => {
					createMutation.mutate(data, {
						onSuccess: () => {
							toast.success("Template created");
							router.navigate({ to: "/outreach-composer/email-templates" });
						},
						onError: () => {
							toast.error("Failed to create template");
						},
					});
				}}
			/>
		</div>
	);
}
