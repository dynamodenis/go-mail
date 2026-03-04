import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CollectionFormDialog } from "../components/collection-form-dialog";

// Mock heavy sub-components
vi.mock("../components/collections-form/collection-color-picker", () => ({
	CollectionColorPicker: ({ value }: { value: string }) => (
		<div data-testid="color-picker">{value}</div>
	),
}));

vi.mock("../components/collections-form/contact-search-select", () => ({
	ContactSearchSelect: () => <div data-testid="contact-search-select" />,
}));

vi.mock("@/components/global/loader", () => ({
	default: () => <div data-testid="loader" />,
}));

vi.mock("@/components/global/orbiter-box", () => ({
	default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/divider", () => ({
	default: () => <hr />,
}));

const mockCreateMutate = vi.fn();
const mockUpdateMutate = vi.fn();

vi.mock("../api/queries", () => ({
	useCreateCollection: () => ({
		mutate: mockCreateMutate,
		isPending: false,
	}),
	useUpdateCollection: () => ({
		mutate: mockUpdateMutate,
		isPending: false,
	}),
	useCollectionContactIds: () => ({ data: undefined }),
}));

vi.mock("../api/store", () => {
	let state = {
		collectionDialogOpen: true,
		editingCollection: null as null | Record<string, unknown>,
		closeCollectionDialog: vi.fn(),
	};
	return {
		useCollectionsUIStore: (selector: (s: typeof state) => unknown) =>
			selector(state),
		__setMockState: (overrides: Partial<typeof state>) => {
			state = { ...state, ...overrides };
		},
	};
});

function createQueryClient() {
	return new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
}

function renderDialog() {
	const qc = createQueryClient();
	return render(
		<QueryClientProvider client={qc}>
			<CollectionFormDialog />
		</QueryClientProvider>,
	);
}

describe("CollectionFormDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders create mode title", () => {
		renderDialog();
		expect(screen.getAllByText("Create Collection").length).toBeGreaterThan(0);
	});

	it("renders all form fields", () => {
		renderDialog();
		expect(screen.getByPlaceholderText("e.g. Newsletter Subscribers")).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText("A brief description of this collection"),
		).toBeInTheDocument();
		expect(screen.getByTestId("color-picker")).toBeInTheDocument();
		expect(screen.getByTestId("contact-search-select")).toBeInTheDocument();
	});

	it("renders create button as submit button", () => {
		renderDialog();
		const submitButtons = screen.getAllByRole("button", {
			name: /Create Collection/i,
		});
		expect(submitButtons.length).toBeGreaterThan(0);
	});

	it("shows validation error when name is empty", () => {
		renderDialog();
		const form = document.querySelector("form")!;
		fireEvent.submit(form);
		expect(
			screen.getByText("Collection name is required"),
		).toBeInTheDocument();
		expect(mockCreateMutate).not.toHaveBeenCalled();
	});

	it("calls createMutate with form data on valid submit", () => {
		renderDialog();
		const nameInput = screen.getByPlaceholderText(
			"e.g. Newsletter Subscribers",
		);
		fireEvent.change(nameInput, { target: { value: "My Collection" } });

		const form = document.querySelector("form")!;
		fireEvent.submit(form);

		expect(mockCreateMutate).toHaveBeenCalledWith(
			expect.objectContaining({ name: "My Collection" }),
			expect.any(Object),
		);
	});

	it("clears validation error when user types in name field", () => {
		renderDialog();
		const form = document.querySelector("form")!;
		fireEvent.submit(form);
		expect(
			screen.getByText("Collection name is required"),
		).toBeInTheDocument();

		const nameInput = screen.getByPlaceholderText(
			"e.g. Newsletter Subscribers",
		);
		fireEvent.change(nameInput, { target: { value: "Test" } });
		expect(
			screen.queryByText("Collection name is required"),
		).not.toBeInTheDocument();
	});

	it("renders cancel button", () => {
		renderDialog();
		const cancelButtons = screen.getAllByRole("button", { name: /Cancel/i });
		expect(cancelButtons.length).toBeGreaterThan(0);
	});
});
