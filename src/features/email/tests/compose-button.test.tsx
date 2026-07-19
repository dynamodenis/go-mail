import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useEmailUIStore } from "../api/store";
import { ComposeButton } from "../components/compose/compose-button";

describe("ComposeButton", () => {
	beforeEach(() => {
		useEmailUIStore.setState({ composeOpen: false, composeMinimized: true });
	});

	it("renders the compose action with its shortcut hint", () => {
		render(<ComposeButton />);
		expect(
			screen.getByRole("button", { name: /compose/i }),
		).toBeInTheDocument();
		expect(screen.getByText("C")).toBeInTheDocument();
	});

	it("opens the compose window expanded on click", () => {
		render(<ComposeButton />);
		fireEvent.click(screen.getByRole("button", { name: /compose/i }));
		expect(useEmailUIStore.getState().composeOpen).toBe(true);
		// Reopening always restores the full window, even if it was minimized.
		expect(useEmailUIStore.getState().composeMinimized).toBe(false);
	});

	it("opens the compose window with the C shortcut", () => {
		render(<ComposeButton />);
		fireEvent.keyDown(document.body, { key: "c", code: "KeyC" });
		expect(useEmailUIStore.getState().composeOpen).toBe(true);
	});
});
