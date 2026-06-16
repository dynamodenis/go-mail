import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { useEmailUIStore } from "../api/store";
import { ThreadList } from "../components/thread-list/thread-list";

const createClient = () =>
	new QueryClient({ defaultOptions: { queries: { retry: false } } });

function withClient(ui: ReactNode) {
	return (
		<QueryClientProvider client={createClient()}>{ui}</QueryClientProvider>
	);
}

describe("ThreadList", () => {
	beforeEach(() => {
		useEmailUIStore.setState({
			searchQuery: "",
			selectedThread: null,
			previewThread: null,
		});
	});

	it("renders the folder's threads", async () => {
		render(withClient(<ThreadList folder="inbox" />));
		expect(await screen.findByText("Q3 roadmap review")).toBeInTheDocument();
		expect(screen.getByText("Re: Contract renewal")).toBeInTheDocument();
	});

	it("selecting a thread stores it in the UI store", async () => {
		render(withClient(<ThreadList folder="inbox" />));
		const row = await screen.findByText("Q3 roadmap review");
		fireEvent.click(row);
		expect(useEmailUIStore.getState().selectedThread?.id).toBe("t1");
	});

	it("hovering a thread previews it in the UI store", async () => {
		render(withClient(<ThreadList folder="inbox" />));
		const row = await screen.findByText("Re: Contract renewal");
		const button = row.closest("button");

		expect(button).not.toBeNull();
		fireEvent.mouseEnter(button as HTMLButtonElement);
		expect(useEmailUIStore.getState().previewThread?.id).toBe("t2");
	});

	it("filters threads by the search query", async () => {
		useEmailUIStore.setState({ searchQuery: "contract" });
		render(withClient(<ThreadList folder="inbox" />));
		await waitFor(() =>
			expect(screen.getByText("Re: Contract renewal")).toBeInTheDocument(),
		);
		expect(screen.queryByText("Q3 roadmap review")).not.toBeInTheDocument();
	});

	it("shows the empty state for a search with no matches", async () => {
		useEmailUIStore.setState({ searchQuery: "zzzznomatch" });
		render(withClient(<ThreadList folder="inbox" />));
		expect(await screen.findByText("No emails found")).toBeInTheDocument();
	});
});
