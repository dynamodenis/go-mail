import type { NylasAccount } from "@/features/settings/types";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ComposeFromField } from "../components/compose/compose-from-field";

const account = (overrides: Partial<NylasAccount>): NylasAccount => ({
	id: "a1",
	email: "denis@gomail.dev",
	isPrimary: true,
	createdAt: "2026-01-01T00:00:00.000Z",
	...overrides,
});

const connection: { data: { configured: boolean; accounts: NylasAccount[] } } =
	{
		data: { configured: true, accounts: [] },
	};

vi.mock("@/features/settings/api/queries", () => ({
	useNylasConnection: () => connection,
}));

describe("ComposeFromField", () => {
	beforeEach(() => {
		connection.data = {
			configured: true,
			accounts: [
				account({ id: "a1", email: "denis@gomail.dev", isPrimary: true }),
				account({ id: "a2", email: "denis@agency.io", isPrimary: false }),
			],
		};
	});

	it("renders nothing with a single connected account", () => {
		connection.data.accounts = [account({})];
		render(<ComposeFromField fromAccountId={null} onChange={vi.fn()} />);
		expect(screen.queryByText("From")).not.toBeInTheDocument();
	});

	it("defaults to the primary account when nothing is selected", () => {
		render(<ComposeFromField fromAccountId={null} onChange={vi.fn()} />);
		expect(
			screen.getByRole("button", { name: "From account" }),
		).toHaveTextContent("denis@gomail.dev");
	});

	it("shows the selected account on the trigger", () => {
		render(<ComposeFromField fromAccountId="a2" onChange={vi.fn()} />);
		expect(
			screen.getByRole("button", { name: "From account" }),
		).toHaveTextContent("denis@agency.io");
	});

	it("selecting another mailbox reports its account id", async () => {
		const onChange = vi.fn();
		render(<ComposeFromField fromAccountId={null} onChange={onChange} />);

		fireEvent.pointerDown(screen.getByRole("button", { name: "From account" }));
		fireEvent.click(await screen.findByText("denis@agency.io"));

		expect(onChange).toHaveBeenCalledWith("a2");
	});
});
