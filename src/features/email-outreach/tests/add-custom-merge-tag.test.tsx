import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AddCustomMergeTag } from "../components/add-custom-merge-tag";

describe("AddCustomMergeTag", () => {
	it("renders label input and buttons", () => {
		render(
			<AddCustomMergeTag existingValues={[]} onAdd={vi.fn()} onCancel={vi.fn()} />,
		);
		expect(screen.getByPlaceholderText("e.g. Company Name")).toBeInTheDocument();
		expect(screen.getByText("Add Tag")).toBeInTheDocument();
		expect(screen.getByText("Cancel")).toBeInTheDocument();
	});

	it("shows formatted tag value as user types", () => {
		render(
			<AddCustomMergeTag existingValues={[]} onAdd={vi.fn()} onCancel={vi.fn()} />,
		);
		fireEvent.change(screen.getByPlaceholderText("e.g. Company Name"), {
			target: { value: "Company Name" },
		});
		expect(screen.getByText("Tag: {company_name}")).toBeInTheDocument();
	});

	it("calls onAdd with formatted tag on submit", () => {
		const onAdd = vi.fn();
		render(
			<AddCustomMergeTag existingValues={[]} onAdd={onAdd} onCancel={vi.fn()} />,
		);
		fireEvent.change(screen.getByPlaceholderText("e.g. Company Name"), {
			target: { value: "Company Name" },
		});
		fireEvent.click(screen.getByText("Add Tag"));
		expect(onAdd).toHaveBeenCalledWith({
			label: "Company Name",
			value: "{company_name}",
		});
	});

	it("shows error when label is empty", () => {
		render(
			<AddCustomMergeTag existingValues={[]} onAdd={vi.fn()} onCancel={vi.fn()} />,
		);
		fireEvent.click(screen.getByText("Add Tag"));
		expect(screen.getByText("Label is required")).toBeInTheDocument();
	});

	it("shows error for duplicate tag", () => {
		render(
			<AddCustomMergeTag
				existingValues={["{company_name}"]}
				onAdd={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);
		fireEvent.change(screen.getByPlaceholderText("e.g. Company Name"), {
			target: { value: "Company Name" },
		});
		fireEvent.click(screen.getByText("Add Tag"));
		expect(screen.getByText("This tag already exists")).toBeInTheDocument();
	});

	it("calls onCancel when cancel is clicked", () => {
		const onCancel = vi.fn();
		render(
			<AddCustomMergeTag existingValues={[]} onAdd={vi.fn()} onCancel={onCancel} />,
		);
		fireEvent.click(screen.getByText("Cancel"));
		expect(onCancel).toHaveBeenCalled();
	});
});
