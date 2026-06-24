import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NylasConnectionCard } from "../components/nylas-connection-card";
import type { NylasAccount, NylasConnection } from "../types";

function account(overrides: Partial<NylasAccount> = {}): NylasAccount {
	return {
		id: "acc-1",
		email: "user@example.com",
		isPrimary: true,
		createdAt: "2026-06-01T00:00:00.000Z",
		...overrides,
	};
}

function renderCard(connection: NylasConnection, overrides = {}) {
	const props = {
		connection,
		onConnect: vi.fn(),
		onDisconnect: vi.fn(),
		onSetPrimary: vi.fn(),
		isConnecting: false,
		disconnectingId: null,
		settingPrimaryId: null,
		...overrides,
	};
	render(<NylasConnectionCard {...props} />);
	return props;
}

describe("NylasConnectionCard", () => {
	it("shows a not-configured message and no Connect button when env is missing", () => {
		renderCard({ configured: false, accounts: [] });

		expect(
			screen.getByText(/email connection isn't configured/i),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /connect email/i }),
		).not.toBeInTheDocument();
	});

	it("shows a Connect button when configured but no accounts", () => {
		const { onConnect } = renderCard({ configured: true, accounts: [] });

		const button = screen.getByRole("button", { name: /connect email/i });
		fireEvent.click(button);
		expect(onConnect).toHaveBeenCalledOnce();
	});

	it("lists connected accounts with a primary badge and an inbox link", () => {
		renderCard({ configured: true, accounts: [account()] });

		expect(screen.getByText("user@example.com")).toBeInTheDocument();
		expect(screen.getByText("Primary")).toBeInTheDocument();
		expect(screen.getByText("1 connected")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /open inbox/i })).toHaveAttribute(
			"href",
			"/email",
		);
	});

	it("disconnects the clicked account", () => {
		const { onDisconnect } = renderCard({
			configured: true,
			accounts: [account()],
		});

		fireEvent.click(screen.getByRole("button", { name: /disconnect/i }));
		expect(onDisconnect).toHaveBeenCalledWith("acc-1");
	});

	it("offers Make primary only on non-primary accounts and calls back with its id", () => {
		const { onSetPrimary } = renderCard({
			configured: true,
			accounts: [
				account({ id: "acc-1", email: "primary@example.com", isPrimary: true }),
				account({
					id: "acc-2",
					email: "second@example.com",
					isPrimary: false,
				}),
			],
		});

		// Only the non-primary account exposes the action.
		const makePrimary = screen.getByRole("button", { name: /make primary/i });
		fireEvent.click(makePrimary);
		expect(onSetPrimary).toHaveBeenCalledWith("acc-2");
	});

	it("can connect another account when some already exist", () => {
		const { onConnect } = renderCard({
			configured: true,
			accounts: [account()],
		});

		fireEvent.click(
			screen.getByRole("button", { name: /connect another account/i }),
		);
		expect(onConnect).toHaveBeenCalledOnce();
	});

	it("disables the Connect button while connecting", () => {
		renderCard({ configured: true, accounts: [] }, { isConnecting: true });

		expect(screen.getByRole("button", { name: /redirecting/i })).toBeDisabled();
	});
});
