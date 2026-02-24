import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RecentCampaignsTable } from "../components/recent-campaigns-table";
import type { RecentCampaignItem } from "../types";

vi.mock("../api/queries", () => ({
	useRecentCampaigns: vi.fn(),
}));

import { useRecentCampaigns } from "../api/queries";
const mockUseRecentCampaigns = vi.mocked(useRecentCampaigns);

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

const mockCampaigns: RecentCampaignItem[] = [
	{
		id: "1",
		name: "Welcome Campaign",
		status: "COMPLETED",
		sentAt: "2026-02-20T10:00:00Z",
		totalSends: 500,
		openRate: 35.2,
		clickRate: 12.1,
	},
	{
		id: "2",
		name: "Newsletter Feb",
		status: "SENDING",
		sentAt: null,
		totalSends: 200,
		openRate: 0,
		clickRate: 0,
	},
];

describe("RecentCampaignsTable", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders loading state", () => {
		mockUseRecentCampaigns.mockReturnValue({
			data: undefined,
			isLoading: true,
			isError: false,
			refetch: vi.fn(),
		} as unknown as ReturnType<typeof useRecentCampaigns>);

		renderWithProviders(<RecentCampaignsTable />);
		expect(screen.getByText("Loading campaigns...")).toBeInTheDocument();
	});

	it("renders error state with retry button", () => {
		mockUseRecentCampaigns.mockReturnValue({
			data: undefined,
			isLoading: false,
			isError: true,
			refetch: vi.fn(),
		} as unknown as ReturnType<typeof useRecentCampaigns>);

		renderWithProviders(<RecentCampaignsTable />);
		expect(screen.getByText("Failed to load recent campaigns.")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
	});

	it("renders empty state when no campaigns", () => {
		mockUseRecentCampaigns.mockReturnValue({
			data: { data: [] },
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		} as unknown as ReturnType<typeof useRecentCampaigns>);

		renderWithProviders(<RecentCampaignsTable />);
		expect(screen.getByText("No campaigns yet")).toBeInTheDocument();
	});

	it("renders campaign rows with status badges", () => {
		mockUseRecentCampaigns.mockReturnValue({
			data: { data: mockCampaigns },
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		} as unknown as ReturnType<typeof useRecentCampaigns>);

		renderWithProviders(<RecentCampaignsTable />);
		expect(screen.getByText("Welcome Campaign")).toBeInTheDocument();
		expect(screen.getByText("Newsletter Feb")).toBeInTheDocument();
		expect(screen.getByText("Completed")).toBeInTheDocument();
		expect(screen.getByText("Sending")).toBeInTheDocument();
		expect(screen.getByText("500")).toBeInTheDocument();
		expect(screen.getByText("35.2%")).toBeInTheDocument();
		expect(screen.getByText("12.1%")).toBeInTheDocument();
	});
});
