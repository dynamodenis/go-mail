import { describe, it, expect, vi } from "vitest";

// Mock server modules to prevent Prisma/DB initialization
vi.mock("../api/server", () => ({
	createCollection: vi.fn(),
	getCollections: vi.fn(),
	getCollectionContactIds: vi.fn(),
	updateCollection: vi.fn(),
	addContactsToCollections: vi.fn(),
	deleteCollection: vi.fn(),
	deleteCollections: vi.fn(),
}));

vi.mock("@/features/contacts/api/server", () => ({
	getContacts: vi.fn(),
}));

import { collectionsKeys } from "../api/queries";

describe("collectionsKeys", () => {
	it("produces correct base key", () => {
		expect(collectionsKeys.all).toEqual(["collections"]);
	});

	it("produces correct lists key", () => {
		expect(collectionsKeys.lists()).toEqual(["collections", "list"]);
	});

	it("produces correct list key with filters", () => {
		const filters = { search: "news", page: 1, pageSize: 25 };
		expect(collectionsKeys.list(filters)).toEqual([
			"collections",
			"list",
			filters,
		]);
	});

	it("produces correct details key", () => {
		expect(collectionsKeys.details()).toEqual(["collections", "detail"]);
	});

	it("produces correct detail key", () => {
		expect(collectionsKeys.detail("abc-123")).toEqual([
			"collections",
			"detail",
			"abc-123",
		]);
	});

	it("list keys with different filters are different", () => {
		const key1 = collectionsKeys.list({ page: 1, pageSize: 25 });
		const key2 = collectionsKeys.list({ search: "test", page: 1, pageSize: 25 });
		expect(key1).not.toEqual(key2);
	});

	it("list key without search is different from with search", () => {
		const key1 = collectionsKeys.list({ page: 1, pageSize: 25 });
		const key2 = collectionsKeys.list({ search: "", page: 1, pageSize: 25 });
		expect(key1).not.toEqual(key2);
	});
});
