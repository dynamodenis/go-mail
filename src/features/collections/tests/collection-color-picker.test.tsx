import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CollectionColorPicker } from "../components/collections-form/collection-color-picker";
import { COLLECTION_COLORS } from "../schemas/types";

describe("CollectionColorPicker", () => {
	it("renders all color swatches", () => {
		render(<CollectionColorPicker value="#3B82F6" onChange={vi.fn()} />);
		const buttons = screen.getAllByRole("button");
		expect(buttons).toHaveLength(COLLECTION_COLORS.length);
	});

	it("each swatch has correct aria-label", () => {
		render(<CollectionColorPicker value="#3B82F6" onChange={vi.fn()} />);
		for (const color of COLLECTION_COLORS) {
			expect(screen.getByLabelText(color.name)).toBeInTheDocument();
		}
	});

	it("calls onChange with the color value when a swatch is clicked", () => {
		const onChange = vi.fn();
		render(<CollectionColorPicker value="#3B82F6" onChange={onChange} />);
		fireEvent.click(screen.getByLabelText("Red"));
		expect(onChange).toHaveBeenCalledWith("#EF4444");
	});

	it("shows check icon on selected color only", () => {
		const { container } = render(
			<CollectionColorPicker value="#EF4444" onChange={vi.fn()} />,
		);
		// The selected swatch should have the ring class
		const redButton = screen.getByLabelText("Red");
		expect(redButton.className).toContain("ring-2");
		// Non-selected should not
		const blueButton = screen.getByLabelText("Blue");
		expect(blueButton.className).not.toContain("ring-2");
	});

	it("does not call onChange on render", () => {
		const onChange = vi.fn();
		render(<CollectionColorPicker value="#3B82F6" onChange={onChange} />);
		expect(onChange).not.toHaveBeenCalled();
	});
});
