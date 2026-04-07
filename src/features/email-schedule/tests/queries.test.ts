import { describe, it, expect, vi } from "vitest";

// Mock server modules to prevent Prisma/DB initialization
vi.mock("../api/server", () => ({
	createEmailBatch: vi.fn(),
	getEmailBatches: vi.fn(),
	getEmailBatchById: vi.fn(),
	cancelEmailBatch: vi.fn(),
	getEmailBatchRecipients: vi.fn(),
}));

import { emailBatchKeys } from "../api/queries";

describe("emailBatchKeys", () => {
	it("produces correct base key", () => {
		expect(emailBatchKeys.all).toEqual(["email-batches"]);
	});

	it("produces correct lists key", () => {
		expect(emailBatchKeys.lists()).toEqual(["email-batches", "list"]);
	});

	it("produces correct list key with filters", () => {
		const filters = { status: "PENDING" as const, page: 1, pageSize: 25 };
		expect(emailBatchKeys.list(filters)).toEqual([
			"email-batches",
			"list",
			filters,
		]);
	});

	it("produces correct list key without filters", () => {
		expect(emailBatchKeys.list()).toEqual([
			"email-batches",
			"list",
			undefined,
		]);
	});

	it("produces correct details key", () => {
		expect(emailBatchKeys.details()).toEqual(["email-batches", "detail"]);
	});

	it("produces correct detail key with id", () => {
		expect(emailBatchKeys.detail("batch-123")).toEqual([
			"email-batches",
			"detail",
			"batch-123",
		]);
	});

	it("produces correct recipients key", () => {
		expect(
			emailBatchKeys.recipients("batch-123", { page: 1, pageSize: 25 }),
		).toEqual([
			"email-batches",
			"recipients",
			"batch-123",
			{ page: 1, pageSize: 25 },
		]);
	});

	it("produces correct recipients key with status filter", () => {
		expect(
			emailBatchKeys.recipients("batch-123", {
				status: "SENT",
				page: 1,
				pageSize: 25,
			}),
		).toEqual([
			"email-batches",
			"recipients",
			"batch-123",
			{ status: "SENT", page: 1, pageSize: 25 },
		]);
	});

	it("list keys with different filters are different", () => {
		const key1 = emailBatchKeys.list({ page: 1, pageSize: 25 });
		const key2 = emailBatchKeys.list({
			status: "PENDING",
			page: 1,
			pageSize: 25,
		});
		expect(key1).not.toEqual(key2);
	});

	it("recipient keys with different batchIds are different", () => {
		const key1 = emailBatchKeys.recipients("batch-1");
		const key2 = emailBatchKeys.recipients("batch-2");
		expect(key1).not.toEqual(key2);
	});
});
