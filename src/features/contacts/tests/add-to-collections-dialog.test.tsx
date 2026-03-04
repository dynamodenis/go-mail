import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AddToCollectionsDialog } from "../components/contacts-table/add-to-collections-dialog";

// Mock heavy dependencies
vi.mock("@/components/global/orbiter-box", () => ({
	default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/divider", () => ({
	default: () => <hr />,
}));

const mockCollections = [
	{
		id: "col-1",
		name: "Newsletter",
		description: "",
		color: "#3B82F6",
		contactCount: 10,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	{
		id: "col-2",
		name: "VIP Customers",
		description: "",
		color: "#EF4444",
		contactCount: 5,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
];

const mockAddToCollections = vi.fn();

vi.mock("@/features/collections/api/queries", () => ({
	useSearchCollections: vi.fn(),
	useAddContactsToCollections: () => ({
		mutate: mockAddToCollections,
		isPending: false,
	}),
}));

import { useSearchCollections } from "@/features/collections/api/queries";
const mockUseSearchCollections = vi.mocked(useSearchCollections);

function createQueryClient() {
	return new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
}

function renderDialog(props: Partial<React.ComponentProps<typeof AddToCollectionsDialog>> = {}) {
	const qc = createQueryClient();
	const defaultProps = {
		open: true,
		onOpenChange: vi.fn(),
		contactIds: ["c1", "c2"],
		onSuccess: vi.fn(),
		...props,
	};
	return {
		...render(
			<QueryClientProvider client={qc}>
				<AddToCollectionsDialog {...defaultProps} />
			</QueryClientProvider>,
		),
		props: defaultProps,
	};
}

describe("AddToCollectionsDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseSearchCollections.mockReturnValue({
			data: { collections: mockCollections, total: 2 },
			fetchNextPage: vi.fn(),
			hasNextPage: false,
			isFetchingNextPage: false,
			isLoading: false,
		} as unknown as ReturnType<typeof useSearchCollections>);
	});

	it("renders dialog title", () => {
		renderDialog();
		expect(screen.getAllByText("Add to Collections").length).toBeGreaterThan(0);
	});

	it("shows contact count in description", () => {
		renderDialog({ contactIds: ["c1", "c2", "c3"] });
		expect(screen.getByText("3 contacts")).toBeInTheDocument();
	});

	it("shows singular for single contact", () => {
		renderDialog({ contactIds: ["c1"] });
		expect(screen.getByText("1 contact")).toBeInTheDocument();
	});

	it("renders search input", () => {
		renderDialog();
		expect(
			screen.getByPlaceholderText("Search collections..."),
		).toBeInTheDocument();
	});

	it("renders collection cards", () => {
		renderDialog();
		expect(screen.getByText("Newsletter")).toBeInTheDocument();
		expect(screen.getByText("VIP Customers")).toBeInTheDocument();
	});

	it("shows collection contact counts", () => {
		renderDialog();
		expect(screen.getByText(/10 contacts/)).toBeInTheDocument();
		expect(screen.getByText(/5 contacts/)).toBeInTheDocument();
	});

	it("shows total collection count", () => {
		renderDialog();
		expect(screen.getByText("2 collections")).toBeInTheDocument();
	});

	it("shows 0 selected initially", () => {
		renderDialog();
		expect(screen.getByText("0 selected")).toBeInTheDocument();
	});

	it("save button is disabled when nothing is selected", () => {
		renderDialog();
		const saveButton = screen.getByRole("button", { name: /Add to/i });
		expect(saveButton).toBeDisabled();
	});

	it("shows loading state", () => {
		mockUseSearchCollections.mockReturnValue({
			data: { collections: [], total: 0 },
			fetchNextPage: vi.fn(),
			hasNextPage: false,
			isFetchingNextPage: false,
			isLoading: true,
		} as unknown as ReturnType<typeof useSearchCollections>);

		renderDialog();
		expect(screen.getByText("Loading collections...")).toBeInTheDocument();
	});

	it("shows empty state", () => {
		mockUseSearchCollections.mockReturnValue({
			data: { collections: [], total: 0 },
			fetchNextPage: vi.fn(),
			hasNextPage: false,
			isFetchingNextPage: false,
			isLoading: false,
		} as unknown as ReturnType<typeof useSearchCollections>);

		renderDialog();
		expect(screen.getByText("No collections found")).toBeInTheDocument();
	});

	it("renders cancel button", () => {
		renderDialog();
		expect(
			screen.getByRole("button", { name: /Cancel/i }),
		).toBeInTheDocument();
	});

	it("does not render when open is false", () => {
		renderDialog({ open: false });
		expect(
			screen.queryByText("Add to Collections"),
		).not.toBeInTheDocument();
	});
});
