import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEmailUIStore } from "../api/store";
import { ThreadDetailPanel } from "../components/thread-detail/thread-detail-panel";
import { getMockThreadDetail, getMockThreads } from "../data/mock-threads";

// Mock the detail query so the panel renders fixture messages without hitting
// the Nylas-backed server function.
vi.mock("../api/queries", () => ({
	useEmailThreadDetail: (threadId: string | null) => ({
		data: threadId ? getMockThreadDetail(threadId) : undefined,
		isLoading: false,
		isError: false,
		error: null,
	}),
}));

const createClient = () =>
	new QueryClient({ defaultOptions: { queries: { retry: false } } });

function withClient(ui: ReactNode) {
	return (
		<QueryClientProvider client={createClient()}>{ui}</QueryClientProvider>
	);
}

describe("ThreadDetailPanel", () => {
	beforeEach(() => {
		useEmailUIStore.setState({
			searchQuery: "",
			selectedThread: null,
			previewThread: null,
		});
	});

	it("shows the hovered preview thread before the selected thread", async () => {
		const [selectedThread, previewThread] = getMockThreads("inbox");
		useEmailUIStore.setState({ selectedThread, previewThread });

		render(withClient(<ThreadDetailPanel />));

		expect(screen.getByText("Re: Contract renewal")).toBeInTheDocument();
		expect(screen.queryByText("Q3 roadmap review")).not.toBeInTheDocument();
		expect(
			await screen.findAllByText(
				"Thanks for the quick turnaround. We're good to proceed with the annual plan.",
			),
		).toHaveLength(2);
	});
});
