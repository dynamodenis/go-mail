import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TemplateAttachmentPanel } from "../components/editor/template-attachment-panel";
import type { TemplateAttachment } from "../types";

const MOCK_ATTACHMENTS: TemplateAttachment[] = [
	{
		id: "att-1",
		templateId: "tpl-1",
		fileName: "report.pdf",
		fileUrl: "https://example.com/report.pdf",
		fileSize: 1048576,
		mimeType: "application/pdf",
		createdAt: "2025-01-01T00:00:00.000Z",
	},
	{
		id: "att-2",
		templateId: "tpl-1",
		fileName: "logo.png",
		fileUrl: "https://example.com/logo.png",
		fileSize: 2048,
		mimeType: "image/png",
		createdAt: "2025-01-01T00:00:00.000Z",
	},
];

describe("TemplateAttachmentPanel", () => {
	it("shows save-first message when no templateId", () => {
		render(
			<TemplateAttachmentPanel
				attachments={[]}
				onRemove={vi.fn()}
			/>,
		);
		expect(
			screen.getByText("Save template first to add attachments."),
		).toBeInTheDocument();
	});

	it("shows empty state when no attachments", () => {
		render(
			<TemplateAttachmentPanel
				templateId="tpl-1"
				attachments={[]}
				onRemove={vi.fn()}
			/>,
		);
		expect(screen.getByText("No attachments yet.")).toBeInTheDocument();
	});

	it("renders attachment list with names and sizes", () => {
		render(
			<TemplateAttachmentPanel
				templateId="tpl-1"
				attachments={MOCK_ATTACHMENTS}
				onRemove={vi.fn()}
			/>,
		);
		expect(screen.getByText("report.pdf")).toBeInTheDocument();
		expect(screen.getByText("1.0 MB")).toBeInTheDocument();
		expect(screen.getByText("logo.png")).toBeInTheDocument();
		expect(screen.getByText("2.0 KB")).toBeInTheDocument();
	});

	it("calls onRemove with attachment id when delete clicked", () => {
		const onRemove = vi.fn();
		render(
			<TemplateAttachmentPanel
				templateId="tpl-1"
				attachments={MOCK_ATTACHMENTS}
				onRemove={onRemove}
			/>,
		);
		const removeButtons = screen.getAllByRole("button");
		fireEvent.click(removeButtons[0]);
		expect(onRemove).toHaveBeenCalledWith("att-1");
	});
});
