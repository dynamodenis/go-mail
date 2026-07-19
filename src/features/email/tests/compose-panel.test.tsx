import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEmailUIStore } from "../api/store";
import { ComposePanel } from "../components/compose/compose-panel";

// The recipient fields fetch contact suggestions through React Query; these
// tests exercise the panel itself, so stub the hook to keep renders
// provider-free and offline. (A factory mock, not importOriginal — the real
// module's import chain reaches the Prisma client, which can't load in jsdom.)
vi.mock("../api/queries", () => ({
	useRecipientSuggestions: () => ({ data: [] }),
}));

// The From row lists connected Nylas mailboxes via the settings feature; with
// zero/one account it renders nothing, which is the panel's default state here.
vi.mock("@/features/settings/api/queries", () => ({
	useNylasConnection: () => ({
		data: { configured: true, accounts: [] },
	}),
}));

/** Types a recipient into the given field and commits it with Enter. */
function addRecipient(fieldLabel: string, email: string) {
	const input = screen.getByLabelText(fieldLabel);
	fireEvent.change(input, { target: { value: email } });
	fireEvent.keyDown(input, { key: "Enter" });
}

describe("ComposePanel", () => {
	beforeEach(() => {
		useEmailUIStore.setState({ composeOpen: true, composeMinimized: false });
	});

	it("renders nothing while closed", () => {
		useEmailUIStore.setState({ composeOpen: false });
		render(<ComposePanel />);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("renders the compose window with To, Subject and body fields", () => {
		render(<ComposePanel />);
		expect(
			screen.getByRole("dialog", { name: "New message" }),
		).toBeInTheDocument();
		expect(screen.getByLabelText("To recipients")).toBeInTheDocument();
		expect(screen.getByLabelText("Subject")).toBeInTheDocument();
		expect(screen.getByLabelText("Message body")).toBeInTheDocument();
	});

	it("commits typed recipients as chips and enables Send", () => {
		render(<ComposePanel />);
		expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();

		addRecipient("To recipients", "ada@lovelace.dev");

		expect(screen.getByText("ada@lovelace.dev")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /send/i })).toBeEnabled();
	});

	it("keeps Send disabled when no chip is a valid email address", () => {
		render(<ComposePanel />);
		addRecipient("To recipients", "not-an-email");

		expect(screen.getByText("not-an-email")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
	});

	it("removes a chip from its remove button", () => {
		render(<ComposePanel />);
		addRecipient("To recipients", "ada@lovelace.dev");

		fireEvent.click(
			screen.getByRole("button", { name: "Remove ada@lovelace.dev" }),
		);

		expect(screen.queryByText("ada@lovelace.dev")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
	});

	it("reveals the Cc field from the To row toggle", () => {
		render(<ComposePanel />);
		expect(screen.queryByLabelText("Cc recipients")).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Cc" }));

		expect(screen.getByLabelText("Cc recipients")).toBeInTheDocument();
	});

	it("minimizes to just the header from the title bar", () => {
		render(<ComposePanel />);
		fireEvent.click(screen.getByRole("button", { name: "Minimize" }));

		expect(screen.queryByLabelText("Subject")).not.toBeInTheDocument();
		expect(useEmailUIStore.getState().composeMinimized).toBe(true);
	});

	it("closes on Escape", () => {
		render(<ComposePanel />);
		fireEvent.keyDown(screen.getByLabelText("To recipients"), {
			key: "Escape",
		});
		expect(useEmailUIStore.getState().composeOpen).toBe(false);
	});

	it("closes from the header close button", () => {
		render(<ComposePanel />);
		fireEvent.click(screen.getByRole("button", { name: "Close" }));
		expect(useEmailUIStore.getState().composeOpen).toBe(false);
	});

	it("resizes the window with arrow keys on the resize grip", () => {
		render(<ComposePanel />);
		const dialog = screen.getByRole("dialog", { name: "New message" });
		const grip = screen.getByRole("button", {
			name: /resize composer/i,
		});
		const initialWidth = dialog.style.getPropertyValue("--compose-w");

		fireEvent.keyDown(grip, { key: "ArrowRight" });

		expect(dialog.style.getPropertyValue("--compose-w")).not.toBe(initialWidth);
	});

	it("never resizes below the minimum size", () => {
		render(<ComposePanel />);
		const dialog = screen.getByRole("dialog", { name: "New message" });
		const grip = screen.getByRole("button", { name: /resize composer/i });

		// Shrink far past the floor — width steps 32px from 680, floor is 480.
		for (let i = 0; i < 20; i++) {
			fireEvent.keyDown(grip, { key: "ArrowLeft" });
		}

		expect(dialog.style.getPropertyValue("--compose-w")).toBe("480px");
	});
});
