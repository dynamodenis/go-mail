import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MergeTagPanel } from "../components/editor/merge-tag-panel";
import { useTemplatesUIStore } from "../api/store";

vi.mock("../api/queries", () => ({
	useAddMergeTag: () => ({ mutate: vi.fn(), isPending: false }),
	useRemoveMergeTag: () => ({ mutate: vi.fn(), isPending: false }),
}));

function renderWithProvider(ui: React.ReactElement) {
	const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("MergeTagPanel", () => {
	beforeEach(() => {
		useTemplatesUIStore.getState().resetPendingMergeTags();
	});

	it("renders all preset merge tags", () => {
		renderWithProvider(<MergeTagPanel editor={null} />);
		expect(screen.getByText("First Name")).toBeInTheDocument();
		expect(screen.getByText("Full Name")).toBeInTheDocument();
		expect(screen.getByText("Email")).toBeInTheDocument();
	});

	it("shows Add Custom Tag button", () => {
		renderWithProvider(<MergeTagPanel editor={null} />);
		expect(screen.getByText("Add Custom Tag")).toBeInTheDocument();
	});

	it("toggles add form when Add Custom Tag is clicked", () => {
		renderWithProvider(<MergeTagPanel editor={null} />);
		fireEvent.click(screen.getByText("Add Custom Tag"));
		expect(screen.getByPlaceholderText("e.g. Company Name")).toBeInTheDocument();
	});

	it("displays pending merge tags in create mode", () => {
		useTemplatesUIStore
			.getState()
			.addPendingMergeTag({ label: "Company", value: "{company}" });
		renderWithProvider(<MergeTagPanel editor={null} />);
		expect(screen.getByText("Company")).toBeInTheDocument();
		expect(screen.getByText("Custom Tags")).toBeInTheDocument();
	});

	it("displays saved merge tags in edit mode", () => {
		const savedTags = [
			{
				id: "tag-1",
				templateId: "tpl-1",
				label: "Company",
				value: "{company}",
				createdAt: "2025-01-01T00:00:00.000Z",
			},
		];
		renderWithProvider(
			<MergeTagPanel
				editor={null}
				templateId="tpl-1"
				savedMergeTags={savedTags}
			/>,
		);
		expect(screen.getByText("Company")).toBeInTheDocument();
	});

	it("preset tags are disabled when no editor", () => {
		renderWithProvider(<MergeTagPanel editor={null} />);
		const firstNameBtn = screen.getByText("First Name");
		expect(firstNameBtn.closest("button")).toBeDisabled();
	});
});
