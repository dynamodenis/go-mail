import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NylasConnectionCard } from "../components/nylas-connection-card";
import type { NylasConnection } from "../types";

function renderCard(connection: NylasConnection, overrides = {}) {
	const props = {
		connection,
		onConnect: vi.fn(),
		onDisconnect: vi.fn(),
		isConnecting: false,
		isDisconnecting: false,
		...overrides,
	};
	render(<NylasConnectionCard {...props} />);
	return props;
}

describe("NylasConnectionCard", () => {
	it("shows a not-configured message and no Connect button when env is missing", () => {
		renderCard({ configured: false, connected: false, email: null });

		expect(screen.getByText(/isn't configured/i)).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /connect nylas/i }),
		).not.toBeInTheDocument();
	});

	it("shows a Connect button when configured but not connected", () => {
		const { onConnect } = renderCard({
			configured: true,
			connected: false,
			email: null,
		});

		const button = screen.getByRole("button", { name: /connect nylas/i });
		fireEvent.click(button);
		expect(onConnect).toHaveBeenCalledOnce();
	});

	it("shows the connected email and a Disconnect button when connected", () => {
		const { onDisconnect } = renderCard({
			configured: true,
			connected: true,
			email: "user@example.com",
		});

		expect(screen.getByText("user@example.com")).toBeInTheDocument();
		// Exact match targets the status badge, not the "Connected as …" line.
		expect(screen.getByText("Connected")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /disconnect/i }));
		expect(onDisconnect).toHaveBeenCalledOnce();
	});

	it("disables the Connect button while connecting", () => {
		renderCard(
			{ configured: true, connected: false, email: null },
			{ isConnecting: true },
		);

		expect(screen.getByRole("button", { name: /redirecting/i })).toBeDisabled();
	});
});
