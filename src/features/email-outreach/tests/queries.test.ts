import { describe, it, expect, vi } from "vitest";

// Mock the server module to prevent Prisma/DB initialization
vi.mock("../api/server", () => ({
	getTemplates: vi.fn(),
	getTemplateById: vi.fn(),
	createTemplate: vi.fn(),
	updateTemplate: vi.fn(),
	deleteTemplate: vi.fn(),
}));

import { templateKeys } from "../api/queries";

describe("templateKeys", () => {
	it("produces correct base key", () => {
		expect(templateKeys.all).toEqual(["templates"]);
	});

	it("produces correct list key without filters", () => {
		expect(templateKeys.list()).toEqual(["templates", "list", undefined]);
	});

	it("produces correct list key with filters", () => {
		const filters = { search: "welcome", page: 1, pageSize: 25 };
		expect(templateKeys.list(filters)).toEqual([
			"templates",
			"list",
			filters,
		]);
	});

	it("produces correct detail key", () => {
		const id = "abc-123";
		expect(templateKeys.detail(id)).toEqual(["templates", "detail", "abc-123"]);
	});

	it("list keys with different filters are different", () => {
		const key1 = templateKeys.list({ page: 1, pageSize: 25 });
		const key2 = templateKeys.list({
			search: "test",
			page: 1,
			pageSize: 25,
		});
		expect(key1).not.toEqual(key2);
	});
});
