import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ServerError } from "@/lib/server-result";
import { useEmailUIStore } from "../api/store";
import { ThreadList } from "../components/thread-list/thread-list";
import { getMockThreads } from "../data/mock-threads";
import { EMAIL_ERROR } from "../types";

// The component fetches through useEmailThreads, which calls a server function.
// Mock the hook so these tests exercise the component's rendering/interaction
// and its loading/empty/error/not-connected branches in isolation.
const threadsResult: {
	data?: ReturnType<typeof getMockThreads>;
	isLoading: boolean;
	isError: boolean;
	error: unknown;
	refetch: () => void;
} = {
	data: undefined,
	isLoading: false,
	isError: false,
	error: null,
	refetch: vi.fn(),
};

vi.mock("../api/queries", () => ({
	useEmailThreads: () => threadsResult,
}));

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
		Object.assign(threadsResult, {
			data: getMockThreads("inbox"),
			isLoading: false,
			isError: false,
			error: null,
		});
	});

	it("renders the folder's threads", () => {
		render(withClient(<ThreadList folder="inbox" />));
		expect(screen.getByText("Q3 roadmap review")).toBeInTheDocument();
		expect(screen.getByText("Re: Contract renewal")).toBeInTheDocument();
	});

	it("selecting a thread stores it in the UI store", () => {
		render(withClient(<ThreadList folder="inbox" />));
		fireEvent.click(screen.getByText("Q3 roadmap review"));
		expect(useEmailUIStore.getState().selectedThread?.id).toBe("t1");
	});

	it("hovering a thread previews it in the UI store", () => {
		render(withClient(<ThreadList folder="inbox" />));
		const button = screen.getByText("Re: Contract renewal").closest("button");
		expect(button).not.toBeNull();
		fireEvent.mouseEnter(button as HTMLButtonElement);
		expect(useEmailUIStore.getState().previewThread?.id).toBe("t2");
	});

	it("shows the loading skeleton", () => {
		Object.assign(threadsResult, { data: undefined, isLoading: true });
		const { container } = render(withClient(<ThreadList folder="inbox" />));
		expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
	});

	it("shows the empty state when there are no threads", () => {
		Object.assign(threadsResult, { data: [] });
		render(withClient(<ThreadList folder="inbox" />));
		expect(screen.getByText("Inbox zero")).toBeInTheDocument();
	});

	it("shows a connect CTA when no mailbox is connected", () => {
		Object.assign(threadsResult, {
			data: undefined,
			isError: true,
			error: new ServerError(EMAIL_ERROR.NOT_CONNECTED, "nope"),
		});
		render(withClient(<ThreadList folder="inbox" />));
		expect(screen.getByText("No mailbox connected")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /connect a mailbox/i }),
		).toHaveAttribute("href", "/settings/integrations");
	});

	it("shows a generic error state for other failures", () => {
		Object.assign(threadsResult, {
			data: undefined,
			isError: true,
			error: new ServerError(EMAIL_ERROR.FETCH_FAILED, "boom"),
		});
		render(withClient(<ThreadList folder="inbox" />));
		expect(screen.getByText(/failed to load emails/i)).toBeInTheDocument();
	});
});
