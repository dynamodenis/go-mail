import { describe, it, expect, vi } from "vitest";

// Mock server module to prevent Prisma/DB initialization
vi.mock("../api/server", () => ({
	saveContact: vi.fn(),
	getContacts: vi.fn(),
	updateContact: vi.fn(),
	deleteContact: vi.fn(),
	deleteContacts: vi.fn(),
}));

import { contactsKeys } from "../api/queries";

describe("contactsKeys", () => {
	it("produces correct base key", () => {
		expect(contactsKeys.all).toEqual(["contacts"]);
	});

	it("produces correct lists key", () => {
		expect(contactsKeys.lists()).toEqual(["contacts", "list"]);
	});

	it("produces correct list key with filters", () => {
		const filters = { search: "alice", page: 1, pageSize: 25 };
		expect(contactsKeys.list(filters)).toEqual([
			"contacts",
			"list",
			filters,
		]);
	});

	it("produces correct list key with status filter", () => {
		const filters = { status: "ACTIVE" as const, page: 1, pageSize: 25 };
		expect(contactsKeys.list(filters)).toEqual([
			"contacts",
			"list",
			filters,
		]);
	});

	it("produces correct details key", () => {
		expect(contactsKeys.details()).toEqual(["contacts", "detail"]);
	});

	it("produces correct detail key", () => {
		expect(contactsKeys.detail("ct-123")).toEqual([
			"contacts",
			"detail",
			"ct-123",
		]);
	});

	it("list keys with different filters are different", () => {
		const key1 = contactsKeys.list({ page: 1, pageSize: 25 });
		const key2 = contactsKeys.list({
			search: "bob",
			page: 1,
			pageSize: 25,
		});
		expect(key1).not.toEqual(key2);
	});

	it("list keys with different status are different", () => {
		const key1 = contactsKeys.list({
			status: "ACTIVE",
			page: 1,
			pageSize: 25,
		});
		const key2 = contactsKeys.list({
			status: "BOUNCED",
			page: 1,
			pageSize: 25,
		});
		expect(key1).not.toEqual(key2);
	});
});
