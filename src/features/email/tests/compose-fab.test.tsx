import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useEmailUIStore } from "../api/store";
import { ComposeFab } from "../components/compose/compose-fab";

describe("ComposeFab", () => {
	beforeEach(() => {
		useEmailUIStore.setState({ composeOpen: false, composeMinimized: false });
	});

	it("renders the floating compose action", () => {
		render(<ComposeFab />);
		expect(screen.getByRole("button", { name: "Compose" })).toBeInTheDocument();
	});

	it("opens the compose window on click", () => {
		render(<ComposeFab />);
		fireEvent.click(screen.getByRole("button", { name: "Compose" }));
		expect(useEmailUIStore.getState().composeOpen).toBe(true);
	});

	it("hides while the compose window is open", () => {
		useEmailUIStore.setState({ composeOpen: true });
		render(<ComposeFab />);
		expect(
			screen.queryByRole("button", { name: "Compose" }),
		).not.toBeInTheDocument();
	});
});
