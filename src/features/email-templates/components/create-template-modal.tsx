import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogClose,
} from "@/components/ui/dialog";
import OrbiterBox from "@/components/global/orbiter-box";
import { useCreateTemplate } from "../api/queries";
import { useTemplatesUIStore } from "../api/store";
import { TemplateEditorForm } from "./editor/template-editor-form";
import Divider from "@/components/ui/divider";

export function CreateTemplateModal() {
	const { isCreateModalOpen, setCreateModalOpen, pendingMergeTags, resetPendingMergeTags } =
		useTemplatesUIStore();
	const createMutation = useCreateTemplate();

	const handleClose = () => {
		setCreateModalOpen(false);
		resetPendingMergeTags();
	};

	return (
		<Dialog open={isCreateModalOpen} onOpenChange={(open) => !open && handleClose()}>
			<DialogContent
				className="w-full h-full p-0 overflow-hidden rounded-none sm:w-[95vw] sm:h-auto sm:max-h-[95vh] sm:rounded-lg sm:max-w-3xl md:max-w-4xl lg:max-w-5xl lg:resize lg:overflow-auto lg:min-w-[600px] lg:min-h-[500px]"
			>
				<OrbiterBox variant="blue-light-horizontal" borderRadius={8}>
					<div className="flex flex-col bg-background sm:rounded-lg">
						<div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
							<DialogTitle className="text-base font-semibold sm:text-lg">
								Create Template
							</DialogTitle>
							<DialogClose>
								<Button variant="ghost" size="sm" className="h-7 w-7 p-0">
									<X className="h-4 w-4" />
								</Button>
							</DialogClose>
						</div>
						<Divider variant="blue-light-horizontal" />
						<div className="flex-1 overflow-y-auto p-4 sm:p-6 max-h-[calc(100vh-60px)] sm:max-h-[calc(95vh-80px)]">
							<TemplateEditorForm
								mode="create"
								isSaving={createMutation.isPending}
								onSave={(data) => {
									createMutation.mutate(
										{
											...data,
											mergeTags:
												pendingMergeTags.length > 0
													? pendingMergeTags
													: undefined,
										},
										{
											onSuccess: () => {
												toast.success("Template created");
												handleClose();
											},
											onError: () => {
												toast.error("Failed to create template");
											},
										},
									);
								}}
							/>
						</div>
					</div>
				</OrbiterBox>
			</DialogContent>
		</Dialog>
	);
}
