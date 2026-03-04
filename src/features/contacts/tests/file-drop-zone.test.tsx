import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FileDropZone } from "../components/contacts-imports/file-drop-zone";

vi.mock("../utils/download-import-template", () => ({
	downloadImportTemplate: vi.fn(),
	IMPORT_TEMPLATE_HEADERS: ["Email", "First Name", "Last Name", "Phone", "Company"],
}));

describe("FileDropZone", () => {
	const defaultProps = {
		file: null,
		onFileSelect: vi.fn(),
		onFileClear: vi.fn(),
		error: null,
	};

	it("renders the drop zone when no file is selected", () => {
		render(<FileDropZone {...defaultProps} />);
		expect(screen.getByText(/drop your file here/i)).toBeInTheDocument();
		expect(screen.getByText(/CSV, XLSX, XLS/i)).toBeInTheDocument();
	});

	it("renders expected format section with headers", () => {
		render(<FileDropZone {...defaultProps} />);
		expect(screen.getByText("Expected format")).toBeInTheDocument();
		expect(screen.getByText("First Name")).toBeInTheDocument();
		expect(screen.getByText("Last Name")).toBeInTheDocument();
		expect(screen.getByText("Phone")).toBeInTheDocument();
		expect(screen.getByText("Company")).toBeInTheDocument();
		// "Email" appears in both the badge and the description text
		expect(screen.getAllByText(/Email/).length).toBeGreaterThanOrEqual(1);
	});

	it("renders download template link", () => {
		render(<FileDropZone {...defaultProps} />);
		expect(screen.getByText(/download template file/i)).toBeInTheDocument();
	});

	it("calls downloadImportTemplate when link is clicked", async () => {
		const { downloadImportTemplate } = await import(
			"../utils/download-import-template"
		);
		render(<FileDropZone {...defaultProps} />);

		fireEvent.click(screen.getByText(/download template file/i));
		expect(downloadImportTemplate).toHaveBeenCalledOnce();
	});

	it("renders selected file info when a file is provided", () => {
		const file = new File(["data"], "contacts.csv", { type: "text/csv" });
		render(<FileDropZone {...defaultProps} file={file} />);
		expect(screen.getByText("contacts.csv")).toBeInTheDocument();
	});

	it("calls onFileClear when remove button is clicked", () => {
		const onFileClear = vi.fn();
		const file = new File(["data"], "contacts.csv", { type: "text/csv" });
		render(
			<FileDropZone {...defaultProps} file={file} onFileClear={onFileClear} />,
		);

		const removeButton = screen.getByRole("button");
		fireEvent.click(removeButton);
		expect(onFileClear).toHaveBeenCalledOnce();
	});

	it("displays error message when error prop is provided", () => {
		render(<FileDropZone {...defaultProps} error="Something went wrong" />);
		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
	});

	it("calls onFileSelect when a file is dropped", () => {
		const onFileSelect = vi.fn();
		render(<FileDropZone {...defaultProps} onFileSelect={onFileSelect} />);

		const dropZone = screen.getByText(/drop your file here/i).closest(
			"[role='button']",
		)!;
		const csvFile = new File(["email\na@b.com"], "test.csv", {
			type: "text/csv",
		});

		fireEvent.drop(dropZone, {
			dataTransfer: { files: [csvFile] },
		});

		expect(onFileSelect).toHaveBeenCalledWith(csvFile);
	});

	it("shows validation error for unsupported file type on drop", () => {
		render(<FileDropZone {...defaultProps} />);

		const dropZone = screen.getByText(/drop your file here/i).closest(
			"[role='button']",
		)!;
		const pdfFile = new File(["data"], "test.pdf", {
			type: "application/pdf",
		});

		fireEvent.drop(dropZone, {
			dataTransfer: { files: [pdfFile] },
		});

		expect(screen.getByText(/Unsupported file type/)).toBeInTheDocument();
	});
});
