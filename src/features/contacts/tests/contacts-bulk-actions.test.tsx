import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ContactsBulkActions } from "../components/contacts-table/contacts-bulk-actions";

// Mock heavy dependencies
vi.mock("@/components/global/loader", () => ({
	default: () => <div data-testid="loader" />,
}));

vi.mock("@/components/global/orbiter-box", () => ({
	default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/divider", () => ({
	default: () => <hr />,
}));

const mockBulkDelete = vi.fn();

vi.mock("../api/queries", () => ({
	useDeleteContacts: () => ({
		mutate: mockBulkDelete,
		isPending: false,
	}),
}));

// Mock the AddToCollectionsDialog to avoid its complex dependencies
vi.mock("../components/contacts-table/add-to-collections-dialog", () => ({
	AddToCollectionsDialog: ({
		open,
		contactIds,
	}: {
		open: boolean;
		contactIds: string[];
	}) =>
		open ? (
			<div data-testid="add-to-collections-dialog">
				{contactIds.length} contacts
			</div>
		) : null,
}));

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

describe("ContactsBulkActions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns null when no contacts are selected", () => {
		const { container } = renderWithProviders(
			<ContactsBulkActions selectedIds={[]} onClearSelection={vi.fn()} />,
		);
		expect(container.innerHTML).toBe("");
	});

	it("renders selection count", () => {
		renderWithProviders(
			<ContactsBulkActions
				selectedIds={["c1", "c2", "c3"]}
				onClearSelection={vi.fn()}
			/>,
		);
		expect(screen.getByText("3 selected")).toBeInTheDocument();
	});

	it("renders Collections button", () => {
		renderWithProviders(
			<ContactsBulkActions
				selectedIds={["c1"]}
				onClearSelection={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("button", { name: /Collections/i }),
		).toBeInTheDocument();
	});

	it("renders Delete button", () => {
		renderWithProviders(
			<ContactsBulkActions
				selectedIds={["c1"]}
				onClearSelection={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("button", { name: /Delete/i }),
		).toBeInTheDocument();
	});

	it("renders Clear button", () => {
		renderWithProviders(
			<ContactsBulkActions
				selectedIds={["c1"]}
				onClearSelection={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("button", { name: /Clear/i }),
		).toBeInTheDocument();
	});

	it("calls onClearSelection when Clear is clicked", () => {
		const onClear = vi.fn();
		renderWithProviders(
			<ContactsBulkActions selectedIds={["c1"]} onClearSelection={onClear} />,
		);
		fireEvent.click(screen.getByRole("button", { name: /Clear/i }));
		expect(onClear).toHaveBeenCalledTimes(1);
	});

	it("opens delete confirmation dialog when Delete is clicked", () => {
		renderWithProviders(
			<ContactsBulkActions
				selectedIds={["c1", "c2"]}
				onClearSelection={vi.fn()}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: /Delete/i }));
		expect(screen.getByText("Delete 2 Contacts")).toBeInTheDocument();
		expect(
			screen.getByText(/permanently delete 2 contacts/i),
		).toBeInTheDocument();
	});

	it("opens AddToCollectionsDialog when Collections is clicked", () => {
		renderWithProviders(
			<ContactsBulkActions
				selectedIds={["c1", "c2"]}
				onClearSelection={vi.fn()}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: /Collections/i }));
		expect(
			screen.getByTestId("add-to-collections-dialog"),
		).toBeInTheDocument();
		expect(screen.getByText("2 contacts")).toBeInTheDocument();
	});

	it("shows singular text for single contact", () => {
		renderWithProviders(
			<ContactsBulkActions
				selectedIds={["c1"]}
				onClearSelection={vi.fn()}
			/>,
		);
		expect(screen.getByText("1 selected")).toBeInTheDocument();
	});

	it("delete confirmation shows Delete All button", () => {
		renderWithProviders(
			<ContactsBulkActions
				selectedIds={["c1"]}
				onClearSelection={vi.fn()}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: /^Delete$/i }));
		expect(
			screen.getByRole("button", { name: /Delete All/i }),
		).toBeInTheDocument();
	});
});
