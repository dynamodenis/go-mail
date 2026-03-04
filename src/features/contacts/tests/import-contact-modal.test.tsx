import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ImportContactModal } from "../components/contacts-imports/import-contact-modal";

vi.mock("@/components/global/orbiter-box", () => ({
	default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/divider", () => ({
	default: () => <hr />,
}));

const mockImportContacts = vi.fn();

vi.mock("../api/queries", () => ({
	useImportContacts: () => ({
		mutate: mockImportContacts,
		isPending: false,
	}),
}));

vi.mock("@/features/collections/api/queries", () => ({
	useSearchCollections: () => ({
		data: { collections: [], total: 0 },
		fetchNextPage: vi.fn(),
		hasNextPage: false,
	}),
}));

vi.mock("../utils/parse-import-file", () => ({
	validateFile: () => null,
	parseImportFile: vi.fn().mockResolvedValue({
		headers: ["Email", "First Name", "Last Name"],
		rows: [
			{ Email: "john@test.com", "First Name": "John", "Last Name": "Doe" },
			{ Email: "jane@test.com", "First Name": "Jane", "Last Name": "Smith" },
		],
		fileName: "contacts.csv",
	}),
}));

vi.mock("../utils/validate-parsed-contacts", () => ({
	autoDetectMapping: () => [
		{ header: "Email", sampleValue: "john@test.com", field: "email" },
		{ header: "First Name", sampleValue: "John", field: "firstName" },
		{ header: "Last Name", sampleValue: "Doe", field: "lastName" },
	],
	validateParsedContacts: () => [
		{ email: "john@test.com", firstName: "John", lastName: "Doe", isValid: true },
		{ email: "jane@test.com", firstName: "Jane", lastName: "Smith", isValid: true },
	],
}));

function createTestQueryClient() {
	return new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
}

function renderModal(open = true) {
	const onOpenChange = vi.fn();
	const qc = createTestQueryClient();
	render(
		<QueryClientProvider client={qc}>
			<ImportContactModal open={open} onOpenChange={onOpenChange} />
		</QueryClientProvider>,
	);
	return { onOpenChange };
}

describe("ImportContactModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders upload step initially", () => {
		renderModal();
		expect(screen.getByText("Upload File")).toBeInTheDocument();
		expect(screen.getByText(/drop your file here/i)).toBeInTheDocument();
	});

	it("does not render when closed", () => {
		renderModal(false);
		expect(screen.queryByText("Upload File")).not.toBeInTheDocument();
	});

	it("transitions to mapping step after file upload", async () => {
		renderModal();

		const dropZone = screen.getByRole("button", { name: /drop your file/i });
		const csvFile = new File(["Email\na@b.com"], "contacts.csv", {
			type: "text/csv",
		});

		fireEvent.drop(dropZone, {
			dataTransfer: { files: [csvFile] },
		});

		await waitFor(() => {
			expect(screen.getByText("Map Columns")).toBeInTheDocument();
		});
	});

	it("transitions to preview step when Continue is clicked", async () => {
		renderModal();

		const dropZone = screen.getByRole("button", { name: /drop your file/i });
		const csvFile = new File(["Email\na@b.com"], "contacts.csv", {
			type: "text/csv",
		});

		fireEvent.drop(dropZone, {
			dataTransfer: { files: [csvFile] },
		});

		await waitFor(() => {
			expect(screen.getByText("Map Columns")).toBeInTheDocument();
		});

		const continueBtn = screen.getByRole("button", {
			name: /continue to preview/i,
		});
		fireEvent.click(continueBtn);

		await waitFor(() => {
			expect(screen.getByText("Preview & Import")).toBeInTheDocument();
		});
	});
});
