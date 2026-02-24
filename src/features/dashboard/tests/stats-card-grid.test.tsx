import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatsCardGrid } from "../components/stats-card-grid";
import type { DashboardKpiResponse, KpiCardData } from "../types";

vi.mock("../api/queries", () => ({
	useDashboardKpis: vi.fn(),
}));

vi.mock("../api/store", () => ({
	useDashboardUIStore: vi.fn((selector: (state: { selectedDateRange: string }) => string) =>
		selector({ selectedDateRange: "7d" }),
	),
}));

import { useDashboardKpis } from "../api/queries";
const mockUseDashboardKpis = vi.mocked(useDashboardKpis);

function createQueryClient() {
	return new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
}

function renderWithProviders(ui: React.ReactElement) {
	const qc = createQueryClient();
	return render(
		<QueryClientProvider client={qc}>{ui}</QueryClientProvider>,
	);
}

function makeKpi(label: string, value: number): KpiCardData {
	return {
		label,
		value,
		previousValue: 0,
		changePercent: 0,
		format: "number",
	};
}

const mockKpis: DashboardKpiResponse = {
	totalSends: makeKpi("Total Sends", 500),
	delivered: makeKpi("Delivered", 480),
	opened: { ...makeKpi("Open Rate", 32), format: "rate" },
	clicked: { ...makeKpi("Click Rate", 12), format: "rate" },
	bounced: { ...makeKpi("Bounce Rate", 2), format: "rate" },
	totalContacts: makeKpi("Total Contacts", 1000),
};

describe("StatsCardGrid", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders loading state", () => {
		mockUseDashboardKpis.mockReturnValue({
			data: undefined,
			isLoading: true,
			isError: false,
			refetch: vi.fn(),
		} as unknown as ReturnType<typeof useDashboardKpis>);

		renderWithProviders(<StatsCardGrid />);
		expect(screen.getByText("Loading stats...")).toBeInTheDocument();
	});

	it("renders error state with retry", () => {
		mockUseDashboardKpis.mockReturnValue({
			data: undefined,
			isLoading: false,
			isError: true,
			refetch: vi.fn(),
		} as unknown as ReturnType<typeof useDashboardKpis>);

		renderWithProviders(<StatsCardGrid />);
		expect(screen.getByText("Failed to load dashboard stats.")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
	});

	it("renders all 6 KPI cards", () => {
		mockUseDashboardKpis.mockReturnValue({
			data: { data: mockKpis },
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		} as unknown as ReturnType<typeof useDashboardKpis>);

		renderWithProviders(<StatsCardGrid />);
		expect(screen.getByText("Total Sends")).toBeInTheDocument();
		expect(screen.getByText("Delivered")).toBeInTheDocument();
		expect(screen.getByText("Open Rate")).toBeInTheDocument();
		expect(screen.getByText("Click Rate")).toBeInTheDocument();
		expect(screen.getByText("Bounce Rate")).toBeInTheDocument();
		expect(screen.getByText("Total Contacts")).toBeInTheDocument();
	});
});
