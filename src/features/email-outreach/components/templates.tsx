import { Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useTemplates, useDeleteTemplate } from "../api/queries";
import { useTemplatesUIStore } from "../api/store";
import { TemplateFiltersBar } from "./template-filters-bar";
import { TemplateGrid } from "./template-grid";
import { TemplatePagination } from "./template-pagination";
import { CreateTemplateModal } from "./create-template-modal";

function Templates() {
	const {
		searchQuery,
		selectedCategory,
		currentPage,
		deleteConfirmId,
		setCurrentPage,
		setDeleteConfirmId,
		setCreateModalOpen,
	} = useTemplatesUIStore();

	const filters = {
		search: searchQuery || undefined,
		category: selectedCategory ?? undefined,
		page: currentPage,
		pageSize: 25,
	};

	const { data, isLoading, isError, refetch } = useTemplates(filters);
	const deleteMutation = useDeleteTemplate();

	const handleDelete = () => {
		if (!deleteConfirmId) return;
		deleteMutation.mutate(deleteConfirmId, {
			onSuccess: () => {
				toast.success("Template deleted");
				setDeleteConfirmId(null);
			},
			onError: () => {
				toast.error("Failed to delete template");
			},
		});
	};

	return (
		<div>
			<PageHeader
				title="Templates"
				description="Create and manage your email templates."
				actions={
					<Button onClick={() => setCreateModalOpen(true)}>
						<Plus className="mr-2 h-4 w-4" />
						Create Template
					</Button>
				}
			/>

			<TemplateFiltersBar />

			<div className="mt-6">
				{isLoading && <LoadingState message="Loading templates..." />}
				{isError && (
					<ErrorState
						message="Failed to load templates."
						onRetry={refetch}
					/>
				)}
				{!isLoading && !isError && data?.data?.data.length === 0 && (
					<EmptyState
						icon={FileText}
						title="No templates yet"
						description="Create your first email template to get started."
						actionLabel="Create Template"
						onAction={() => setCreateModalOpen(true)}
					/>
				)}
				{!isLoading && !isError && data?.data && data.data.data.length > 0 && (
					<>
						<TemplateGrid
							templates={data.data.data}
							onDelete={setDeleteConfirmId}
						/>
						<TemplatePagination
							page={data.data.page}
							pageSize={data.data.pageSize}
							total={data.data.total}
							onPageChange={setCurrentPage}
						/>
					</>
				)}
			</div>

			<ConfirmDialog
				open={!!deleteConfirmId}
				onOpenChange={(open) => {
					if (!open) setDeleteConfirmId(null);
				}}
				title="Delete Template"
				description="Are you sure you want to delete this template? This action cannot be undone."
				confirmLabel="Delete"
				variant="destructive"
				onConfirm={handleDelete}
			/>

			<CreateTemplateModal />
		</div>
	);
}

export default Templates;
