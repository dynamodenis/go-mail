import type { Contact } from "@/features/contacts/schemas/types";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ComposeRecipientField } from "../components/compose/compose-recipient-field";

const makeContact = (overrides: Partial<Contact>): Contact =>
	({
		id: "1",
		email: "ada@lovelace.dev",
		firstName: "Ada",
		lastName: "Lovelace",
		phone: null,
		company: null,
		status: "ACTIVE",
		tags: [],
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
		...overrides,
	}) as Contact;

const suggestionResult: { data: Contact[] } = { data: [] };

vi.mock("../api/queries", () => ({
	useRecipientSuggestions: () => suggestionResult,
}));

/** Owns the recipients array like the compose panel does. */
function FieldHarness() {
	const [recipients, setRecipients] = useState<string[]>([]);
	return (
		<ComposeRecipientField
			label="To"
			recipients={recipients}
			onChange={setRecipients}
		/>
	);
}

function typeDraft(value: string) {
	const input = screen.getByLabelText("To recipients");
	fireEvent.change(input, { target: { value } });
	return input;
}

describe("ComposeRecipientField suggestions", () => {
	beforeEach(() => {
		suggestionResult.data = [
			makeContact({ id: "1", email: "ada@lovelace.dev" }),
			makeContact({
				id: "2",
				email: "grace@hopper.dev",
				firstName: "Grace",
				lastName: "Hopper",
			}),
		];
	});

	it("shows matching contacts while typing", () => {
		render(<FieldHarness />);
		typeDraft("a");

		expect(
			screen.getByRole("listbox", { name: "Contact suggestions" }),
		).toBeInTheDocument();
		expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
		expect(screen.getByText("grace@hopper.dev")).toBeInTheDocument();
	});

	it("adds the highlighted contact as a chip with arrow keys + Enter", () => {
		render(<FieldHarness />);
		const input = typeDraft("a");

		fireEvent.keyDown(input, { key: "ArrowDown" });
		fireEvent.keyDown(input, { key: "Enter" });

		// Second option (Grace) was highlighted; her email becomes the chip and
		// the raw draft is never committed.
		expect(
			screen.getByRole("button", { name: "Remove grace@hopper.dev" }),
		).toBeInTheDocument();
		expect(input).toHaveValue("");
	});

	it("adds a contact on click", () => {
		render(<FieldHarness />);
		typeDraft("ada");

		fireEvent.click(screen.getByText("Ada Lovelace"));

		expect(
			screen.getByRole("button", { name: "Remove ada@lovelace.dev" }),
		).toBeInTheDocument();
	});

	it("hides contacts that are already recipients", () => {
		render(<FieldHarness />);
		typeDraft("ada");
		fireEvent.click(screen.getByText("Ada Lovelace"));

		typeDraft("a");

		expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();
		expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
	});

	it("closes the list on Escape without letting it bubble", () => {
		render(<FieldHarness />);
		const input = typeDraft("a");

		fireEvent.keyDown(input, { key: "Escape" });

		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
	});

	it("still commits free-typed addresses that match no contact", () => {
		suggestionResult.data = [];
		render(<FieldHarness />);
		const input = typeDraft("someone@nowhere.io");

		fireEvent.keyDown(input, { key: "Enter" });

		expect(
			screen.getByRole("button", { name: "Remove someone@nowhere.io" }),
		).toBeInTheDocument();
	});
});
