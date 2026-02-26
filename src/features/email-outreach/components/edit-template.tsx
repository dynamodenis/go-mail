import { getRouteApi, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { useTemplate, useUpdateTemplate } from "../api/queries";
import { TemplateEditorForm } from "./template-editor-form";

const routeApi = getRouteApi(
	"/_authenticated/outreach-composer/$templateId/edit",
);

export default function EditTemplate() {
	const { templateId } = routeApi.useParams();
	const router = useRouter();
	const { data, isLoading, isError, refetch } = useTemplate(templateId);
	const updateMutation = useUpdateTemplate();

	if (isLoading) return <LoadingState message="Loading template..." />;
	if (isError || !data?.data)
		return <ErrorState message="Template not found." onRetry={refetch} />;

	const template = data.data;

	return (
		<div>
			<PageHeader
				title="Edit Template"
				description={template.name}
			/>
			<TemplateEditorForm
				mode="edit"
				initialData={template}
				isSaving={updateMutation.isPending}
				onSave={(formData) => {
					updateMutation.mutate(
						{ id: templateId, ...formData },
						{
							onSuccess: () => {
								toast.success("Template updated");
								router.navigate({ to: "/outreach-composer" });
							},
							onError: () => {
								toast.error("Failed to update template");
							},
						},
					);
				}}
			/>
		</div>
	);
}
