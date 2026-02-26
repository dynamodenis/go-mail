import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { TemplateFiltersBar } from "../components/template-filters-bar";
import { useTemplatesUIStore } from "../api/store";

describe("TemplateFiltersBar", () => {
	beforeEach(() => {
		useTemplatesUIStore.getState().resetFilters();
	});

	it("renders search input", () => {
		render(<TemplateFiltersBar />);
		expect(
			screen.getByPlaceholderText("Search templates..."),
		).toBeInTheDocument();
	});

	it("renders category select", () => {
		render(<TemplateFiltersBar />);
		expect(screen.getByText("All Categories")).toBeInTheDocument();
	});

	it("updates search input on type", () => {
		render(<TemplateFiltersBar />);
		const input = screen.getByPlaceholderText("Search templates...");
		fireEvent.change(input, { target: { value: "hello" } });
		expect(input).toHaveValue("hello");
	});
});
