import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTemplatesUIStore } from "../api/store";
import { CreateTemplateModal } from "../components/create-template-modal";

vi.mock("../api/queries", () => ({
	useCreateTemplate: () => ({ mutate: vi.fn(), isPending: false }),
	useRemoveAttachment: () => ({ mutate: vi.fn(), isPending: false }),
	useAddMergeTag: () => ({ mutate: vi.fn(), isPending: false }),
	useRemoveMergeTag: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../components/editor/template-body-editor", () => ({
	TemplateBodyEditor: () => {
		return <div data-testid="mock-editor">Mock Editor</div>;
	},
}));

vi.mock("../components/editor/template-category-select", () => ({
	TemplateCategorySelect: () => <div data-testid="mock-category">Category</div>,
}));

vi.mock("../components/editor/template-attachment-panel", () => ({
	TemplateAttachmentPanel: () => <div data-testid="mock-attachments">Attachments</div>,
}));

function renderWithProvider(ui: React.ReactElement) {
	const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("CreateTemplateModal", () => {
	beforeEach(() => {
		useTemplatesUIStore.getState().setCreateModalOpen(false);
		useTemplatesUIStore.getState().resetPendingMergeTags();
	});

	it("does not render content when closed", () => {
		renderWithProvider(<CreateTemplateModal />);
		expect(screen.queryByTestId("mock-editor")).not.toBeInTheDocument();
	});

	it("renders modal content when open", () => {
		useTemplatesUIStore.getState().setCreateModalOpen(true);
		renderWithProvider(<CreateTemplateModal />);
		expect(screen.getByTestId("mock-editor")).toBeInTheDocument();
	});

	it("renders template name input inside the modal", () => {
		useTemplatesUIStore.getState().setCreateModalOpen(true);
		renderWithProvider(<CreateTemplateModal />);
		expect(screen.getByLabelText("Template Name")).toBeInTheDocument();
	});

	it("renders attachment and category panels", () => {
		useTemplatesUIStore.getState().setCreateModalOpen(true);
		renderWithProvider(<CreateTemplateModal />);
		expect(screen.getByTestId("mock-category")).toBeInTheDocument();
		expect(screen.getByTestId("mock-attachments")).toBeInTheDocument();
	});
});
