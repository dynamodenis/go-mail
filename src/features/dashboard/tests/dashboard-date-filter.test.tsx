import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DashboardDateFilter } from "../components/dashboard-date-filter";

const mockSetDateRange = vi.fn();

vi.mock("../api/store", () => ({
	useDashboardUIStore: vi.fn(
		(selector: (state: { selectedDateRange: string; setDateRange: typeof mockSetDateRange }) => unknown) =>
			selector({ selectedDateRange: "7d", setDateRange: mockSetDateRange }),
	),
}));

describe("DashboardDateFilter", () => {
	it("renders the select trigger with current value", () => {
		render(<DashboardDateFilter />);
		expect(screen.getByRole("combobox")).toBeInTheDocument();
		expect(screen.getByText("Last 7 days")).toBeInTheDocument();
	});
});
