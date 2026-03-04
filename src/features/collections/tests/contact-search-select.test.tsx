import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ContactSearchSelect } from "../components/collections-form/contact-search-select";

const mockContacts = [
	{
		id: "c1",
		email: "alice@example.com",
		firstName: "Alice",
		lastName: "Smith",
		phone: null,
		company: null,
		status: "ACTIVE" as const,
		tags: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	{
		id: "c2",
		email: "bob@example.com",
		firstName: "Bob",
		lastName: null,
		phone: null,
		company: null,
		status: "ACTIVE" as const,
		tags: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	},
];

vi.mock("../api/queries", () => ({
	useSearchContacts: vi.fn(),
}));

import { useSearchContacts } from "../api/queries";
const mockUseSearchContacts = vi.mocked(useSearchContacts);

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

describe("ContactSearchSelect", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders search input", () => {
		mockUseSearchContacts.mockReturnValue({
			data: { contacts: [], total: 0 },
			fetchNextPage: vi.fn(),
			hasNextPage: false,
			isFetchingNextPage: false,
			isLoading: false,
		} as unknown as ReturnType<typeof useSearchContacts>);

		renderWithProviders(
			<ContactSearchSelect selectedIds={[]} onChange={vi.fn()} />,
		);
		expect(
			screen.getByPlaceholderText("Search contacts by name or email..."),
		).toBeInTheDocument();
	});

	it("shows loading state when searching", () => {
		mockUseSearchContacts.mockReturnValue({
			data: { contacts: [], total: 0 },
			fetchNextPage: vi.fn(),
			hasNextPage: false,
			isFetchingNextPage: false,
			isLoading: true,
		} as unknown as ReturnType<typeof useSearchContacts>);

		renderWithProviders(
			<ContactSearchSelect selectedIds={[]} onChange={vi.fn()} />,
		);

		// Focus the input to open dropdown
		fireEvent.focus(
			screen.getByPlaceholderText("Search contacts by name or email..."),
		);
		expect(screen.getByText("Searching contacts...")).toBeInTheDocument();
	});

	it("shows empty state when no contacts found", () => {
		mockUseSearchContacts.mockReturnValue({
			data: { contacts: [], total: 0 },
			fetchNextPage: vi.fn(),
			hasNextPage: false,
			isFetchingNextPage: false,
			isLoading: false,
		} as unknown as ReturnType<typeof useSearchContacts>);

		renderWithProviders(
			<ContactSearchSelect selectedIds={[]} onChange={vi.fn()} />,
		);

		fireEvent.focus(
			screen.getByPlaceholderText("Search contacts by name or email..."),
		);
		expect(screen.getByText("No contacts found")).toBeInTheDocument();
	});

	it("renders contact cards when data is available", () => {
		mockUseSearchContacts.mockReturnValue({
			data: { contacts: mockContacts, total: 2 },
			fetchNextPage: vi.fn(),
			hasNextPage: false,
			isFetchingNextPage: false,
			isLoading: false,
		} as unknown as ReturnType<typeof useSearchContacts>);

		renderWithProviders(
			<ContactSearchSelect selectedIds={[]} onChange={vi.fn()} />,
		);

		fireEvent.focus(
			screen.getByPlaceholderText("Search contacts by name or email..."),
		);
		expect(screen.getByText("Alice Smith")).toBeInTheDocument();
		expect(screen.getByText("alice@example.com")).toBeInTheDocument();
		expect(screen.getByText("Bob")).toBeInTheDocument();
		expect(screen.getByText("bob@example.com")).toBeInTheDocument();
	});

	it("shows selected count in dropdown header", () => {
		mockUseSearchContacts.mockReturnValue({
			data: { contacts: mockContacts, total: 2 },
			fetchNextPage: vi.fn(),
			hasNextPage: false,
			isFetchingNextPage: false,
			isLoading: false,
		} as unknown as ReturnType<typeof useSearchContacts>);

		renderWithProviders(
			<ContactSearchSelect selectedIds={["c1"]} onChange={vi.fn()} />,
		);

		fireEvent.focus(
			screen.getByPlaceholderText("Search contacts by name or email..."),
		);
		expect(screen.getByText("1 selected")).toBeInTheDocument();
	});

	it("calls onChange with toggled id when a contact is clicked", () => {
		mockUseSearchContacts.mockReturnValue({
			data: { contacts: mockContacts, total: 2 },
			fetchNextPage: vi.fn(),
			hasNextPage: false,
			isFetchingNextPage: false,
			isLoading: false,
		} as unknown as ReturnType<typeof useSearchContacts>);

		const onChange = vi.fn();
		renderWithProviders(
			<ContactSearchSelect selectedIds={[]} onChange={onChange} />,
		);

		fireEvent.focus(
			screen.getByPlaceholderText("Search contacts by name or email..."),
		);
		fireEvent.click(screen.getByText("Alice Smith"));
		expect(onChange).toHaveBeenCalledWith(["c1"]);
	});

	it("calls onChange to deselect when a selected contact is clicked", () => {
		mockUseSearchContacts.mockReturnValue({
			data: { contacts: mockContacts, total: 2 },
			fetchNextPage: vi.fn(),
			hasNextPage: false,
			isFetchingNextPage: false,
			isLoading: false,
		} as unknown as ReturnType<typeof useSearchContacts>);

		const onChange = vi.fn();
		renderWithProviders(
			<ContactSearchSelect selectedIds={["c1"]} onChange={onChange} />,
		);

		fireEvent.focus(
			screen.getByPlaceholderText("Search contacts by name or email..."),
		);
		// "Alice Smith" appears twice (badge + card), click the one in the dropdown
		const allAlice = screen.getAllByText("Alice Smith");
		fireEvent.click(allAlice[allAlice.length - 1]);
		expect(onChange).toHaveBeenCalledWith([]);
	});

	it("renders selected contacts as badges", () => {
		mockUseSearchContacts.mockReturnValue({
			data: { contacts: mockContacts, total: 2 },
			fetchNextPage: vi.fn(),
			hasNextPage: false,
			isFetchingNextPage: false,
			isLoading: false,
		} as unknown as ReturnType<typeof useSearchContacts>);

		renderWithProviders(
			<ContactSearchSelect selectedIds={["c1"]} onChange={vi.fn()} />,
		);

		// Badge should show the display name
		expect(screen.getByText("Alice Smith")).toBeInTheDocument();
	});

	it("shows total count in dropdown", () => {
		mockUseSearchContacts.mockReturnValue({
			data: { contacts: mockContacts, total: 50 },
			fetchNextPage: vi.fn(),
			hasNextPage: true,
			isFetchingNextPage: false,
			isLoading: false,
		} as unknown as ReturnType<typeof useSearchContacts>);

		renderWithProviders(
			<ContactSearchSelect selectedIds={[]} onChange={vi.fn()} />,
		);

		fireEvent.focus(
			screen.getByPlaceholderText("Search contacts by name or email..."),
		);
		expect(screen.getByText("50 contacts found")).toBeInTheDocument();
	});
});
