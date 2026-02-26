import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Template } from "../types";

// Mock the TipTap editor to avoid DOM complexity in tests
vi.mock("../components/template-body-editor", () => ({
	TemplateBodyEditor: ({
		onEditorReady,
	}: {
		onEditorReady: (editor: unknown) => void;
	}) => {
		const mockEditor = {
			getHTML: () => "<p>test</p>",
			getJSON: () => ({ type: "doc", content: [] }),
			commands: { setContent: vi.fn() },
			chain: () => ({
				focus: () => ({
					insertMergeTag: () => ({ run: vi.fn() }),
				}),
			}),
		};
		setTimeout(() => onEditorReady(mockEditor), 0);
		return <div data-testid="mock-editor">Mock Editor</div>;
	},
}));

// Mock the category select to avoid ShadCN Select DOM issues
vi.mock("../components/template-category-select", () => ({
	TemplateCategorySelect: () => <div data-testid="mock-category-select">Category Select</div>,
}));

// Mock the merge tag panel
vi.mock("../components/merge-tag-panel", () => ({
	MergeTagPanel: () => <div data-testid="mock-merge-panel">Merge Tags</div>,
}));

// Mock the attachment panel
vi.mock("../components/template-attachment-panel", () => ({
	TemplateAttachmentPanel: () => <div data-testid="mock-attachment-panel">Attachments</div>,
}));

// Mock queries to avoid server function imports
vi.mock("../api/queries", () => ({
	useRemoveAttachment: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { TemplateEditorForm } from "../components/template-editor-form";

const MOCK_TEMPLATE: Template = {
	id: "550e8400-e29b-41d4-a716-446655440000",
	name: "Welcome Email",
	subject: "Welcome!",
	bodyHtml: "<p>Hello</p>",
	bodyJson: {},
	category: "ONBOARDING",
	thumbnailUrl: null,
	timesUsed: 0,
	createdAt: "2025-01-01T00:00:00.000Z",
	updatedAt: "2025-02-01T00:00:00.000Z",
};

describe("TemplateEditorForm", () => {
	const defaultProps = {
		onSave: vi.fn(),
		isSaving: false,
		mode: "create" as const,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders all form fields", () => {
		render(<TemplateEditorForm {...defaultProps} />);
		expect(screen.getByLabelText("Template Name")).toBeInTheDocument();
		expect(screen.getByLabelText("Subject Line")).toBeInTheDocument();
		expect(screen.getByTestId("mock-editor")).toBeInTheDocument();
	});

	it('shows "Create Template" button in create mode', () => {
		render(<TemplateEditorForm {...defaultProps} />);
		expect(screen.getByText("Create Template")).toBeInTheDocument();
	});

	it('shows "Save Changes" button in edit mode', () => {
		render(
			<TemplateEditorForm {...defaultProps} mode="edit" initialData={MOCK_TEMPLATE} />,
		);
		expect(screen.getByText("Save Changes")).toBeInTheDocument();
	});

	it("prefills values from initialData in edit mode", () => {
		render(
			<TemplateEditorForm {...defaultProps} mode="edit" initialData={MOCK_TEMPLATE} />,
		);
		expect(screen.getByDisplayValue("Welcome Email")).toBeInTheDocument();
		expect(screen.getByDisplayValue("Welcome!")).toBeInTheDocument();
	});

	it("disables save button when isSaving", () => {
		render(<TemplateEditorForm {...defaultProps} isSaving={true} />);
		expect(screen.getByText("Saving...")).toBeDisabled();
	});
});
