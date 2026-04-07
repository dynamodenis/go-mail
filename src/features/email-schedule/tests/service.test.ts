import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/lib/errors";

// Mock the repository layer
vi.mock("../api/repository", () => ({
	createBatch: vi.fn(),
	updateBatchStatus: vi.fn(),
	findBatches: vi.fn(),
	findBatchById: vi.fn(),
	cancelBatch: vi.fn(),
	createRecipientRows: vi.fn(),
	updateBatchTotalRecipients: vi.fn(),
	findBatchRecipients: vi.fn(),
}));

// Mock the collections repository
vi.mock("@/features/collections/api/repository", () => ({
	getCollectionContactIds: vi.fn(),
	getContactEmailsByIds: vi.fn(),
}));

import * as service from "../api/service";
import * as repo from "../api/repository";
import * as collectionsRepo from "@/features/collections/api/repository";

const mockRepo = repo as unknown as {
	createBatch: ReturnType<typeof vi.fn>;
	updateBatchStatus: ReturnType<typeof vi.fn>;
	findBatches: ReturnType<typeof vi.fn>;
	findBatchById: ReturnType<typeof vi.fn>;
	cancelBatch: ReturnType<typeof vi.fn>;
	createRecipientRows: ReturnType<typeof vi.fn>;
	updateBatchTotalRecipients: ReturnType<typeof vi.fn>;
	findBatchRecipients: ReturnType<typeof vi.fn>;
};

const mockCollectionsRepo = collectionsRepo as unknown as {
	getCollectionContactIds: ReturnType<typeof vi.fn>;
	getContactEmailsByIds: ReturnType<typeof vi.fn>;
};

const USER_ID = "user-123";
const BATCH_ID = "batch-456";
const COLLECTION_ID = "col-789";

describe("service.createBatch", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("creates a batch with individual sources and expands recipients", async () => {
		mockRepo.createBatch.mockResolvedValue({ id: BATCH_ID, status: "PENDING" });
		mockRepo.updateBatchStatus.mockResolvedValue({});
		mockRepo.createRecipientRows.mockResolvedValue(2);
		mockRepo.updateBatchTotalRecipients.mockResolvedValue({});
		mockRepo.findBatchById.mockResolvedValue({ scheduledAt: null });

		const result = await service.createBatch(USER_ID, {
			subject: "Test",
			bodyHtml: "<p>Hello</p>",
			scheduledAt: null,
			sources: [
				{ type: "INDIVIDUAL", email: "alice@example.com", name: "Alice" },
				{ type: "INDIVIDUAL", email: "bob@example.com" },
			],
		});

		expect(result).toEqual({ id: BATCH_ID, status: "PENDING" });
		expect(mockRepo.createBatch).toHaveBeenCalledOnce();
		expect(mockRepo.updateBatchStatus).toHaveBeenCalledWith(BATCH_ID, "EXPANDING");
		expect(mockRepo.createRecipientRows).toHaveBeenCalledWith(
			BATCH_ID,
			USER_ID,
			expect.arrayContaining([
				{ email: "alice@example.com", name: "Alice" },
				{ email: "bob@example.com", name: null },
			]),
		);
		// Immediate send (scheduledAt=null) → SENDING
		expect(mockRepo.updateBatchStatus).toHaveBeenCalledWith(BATCH_ID, "SENDING");
	});

	it("sets status to PENDING when scheduledAt is in the future", async () => {
		const futureDate = new Date(Date.now() + 86_400_000).toISOString();

		mockRepo.createBatch.mockResolvedValue({ id: BATCH_ID, status: "PENDING" });
		mockRepo.updateBatchStatus.mockResolvedValue({});
		mockRepo.createRecipientRows.mockResolvedValue(1);
		mockRepo.updateBatchTotalRecipients.mockResolvedValue({});
		mockRepo.findBatchById.mockResolvedValue({
			scheduledAt: new Date(futureDate),
		});

		await service.createBatch(USER_ID, {
			subject: "Scheduled",
			bodyHtml: "<p>Later</p>",
			scheduledAt: futureDate,
			sources: [{ type: "INDIVIDUAL", email: "test@example.com" }],
		});

		expect(mockRepo.updateBatchStatus).toHaveBeenCalledWith(BATCH_ID, "PENDING");
	});

	it("throws SCHEDULE_IN_PAST for past scheduledAt", async () => {
		const pastDate = new Date(Date.now() - 86_400_000).toISOString();

		await expect(
			service.createBatch(USER_ID, {
				subject: "Old",
				bodyHtml: "<p>Past</p>",
				scheduledAt: pastDate,
				sources: [{ type: "INDIVIDUAL", email: "test@example.com" }],
			}),
		).rejects.toThrow(AppError);

		await expect(
			service.createBatch(USER_ID, {
				subject: "Old",
				bodyHtml: "<p>Past</p>",
				scheduledAt: pastDate,
				sources: [{ type: "INDIVIDUAL", email: "test@example.com" }],
			}),
		).rejects.toThrow("Scheduled time must be in the future");
	});

	it("expands collection sources via collections repository", async () => {
		mockRepo.createBatch.mockResolvedValue({ id: BATCH_ID, status: "PENDING" });
		mockRepo.updateBatchStatus.mockResolvedValue({});
		mockRepo.createRecipientRows.mockResolvedValue(3);
		mockRepo.updateBatchTotalRecipients.mockResolvedValue({});
		mockRepo.findBatchById.mockResolvedValue({ scheduledAt: null });

		mockCollectionsRepo.getCollectionContactIds.mockResolvedValue([
			"c1",
			"c2",
			"c3",
		]);
		mockCollectionsRepo.getContactEmailsByIds.mockResolvedValue([
			{ id: "c1", email: "a@test.com", firstName: "Alice", lastName: "A" },
			{ id: "c2", email: "b@test.com", firstName: "Bob", lastName: null },
			{ id: "c3", email: "c@test.com", firstName: null, lastName: null },
		]);

		await service.createBatch(USER_ID, {
			subject: "Newsletter",
			bodyHtml: "<p>Hi</p>",
			scheduledAt: null,
			sources: [{ type: "COLLECTION", collectionId: COLLECTION_ID }],
		});

		expect(mockCollectionsRepo.getCollectionContactIds).toHaveBeenCalledWith(
			USER_ID,
			COLLECTION_ID,
		);
		expect(mockCollectionsRepo.getContactEmailsByIds).toHaveBeenCalledWith([
			"c1",
			"c2",
			"c3",
		]);
		expect(mockRepo.createRecipientRows).toHaveBeenCalledWith(
			BATCH_ID,
			USER_ID,
			expect.arrayContaining([
				{ email: "a@test.com", name: "Alice A" },
				{ email: "b@test.com", name: "Bob" },
				{ email: "c@test.com", name: null },
			]),
		);
	});

	it("deduplicates recipients across collection and individual sources", async () => {
		mockRepo.createBatch.mockResolvedValue({ id: BATCH_ID, status: "PENDING" });
		mockRepo.updateBatchStatus.mockResolvedValue({});
		mockRepo.createRecipientRows.mockResolvedValue(2);
		mockRepo.updateBatchTotalRecipients.mockResolvedValue({});
		mockRepo.findBatchById.mockResolvedValue({ scheduledAt: null });

		mockCollectionsRepo.getCollectionContactIds.mockResolvedValue(["c1"]);
		mockCollectionsRepo.getContactEmailsByIds.mockResolvedValue([
			{ id: "c1", email: "dupe@test.com", firstName: "From", lastName: "Collection" },
		]);

		await service.createBatch(USER_ID, {
			subject: "Dedup Test",
			bodyHtml: "<p>Test</p>",
			scheduledAt: null,
			sources: [
				{ type: "COLLECTION", collectionId: COLLECTION_ID },
				{ type: "INDIVIDUAL", email: "dupe@test.com", name: "From Individual" },
				{ type: "INDIVIDUAL", email: "unique@test.com" },
			],
		});

		// The collection version of dupe@test.com should win (added first)
		const recipients = mockRepo.createRecipientRows.mock.calls[0][2];
		expect(recipients).toHaveLength(2);
		const emails = recipients.map((r: { email: string }) => r.email);
		expect(emails).toContain("dupe@test.com");
		expect(emails).toContain("unique@test.com");
	});

	it("sets batch to FAILED when collection returns empty contacts", async () => {
		mockRepo.createBatch.mockResolvedValue({ id: BATCH_ID, status: "PENDING" });
		mockRepo.updateBatchStatus.mockResolvedValue({});

		mockCollectionsRepo.getCollectionContactIds.mockResolvedValue([]);

		await service.createBatch(USER_ID, {
			subject: "Empty",
			bodyHtml: "<p>No one</p>",
			scheduledAt: null,
			sources: [{ type: "COLLECTION", collectionId: COLLECTION_ID }],
		});

		expect(mockRepo.updateBatchStatus).toHaveBeenCalledWith(BATCH_ID, "FAILED");
		expect(mockRepo.createRecipientRows).not.toHaveBeenCalled();
	});

	it("sets batch to FAILED when expansion throws an error", async () => {
		mockRepo.createBatch.mockResolvedValue({ id: BATCH_ID, status: "PENDING" });
		mockRepo.updateBatchStatus.mockResolvedValue({});
		mockCollectionsRepo.getCollectionContactIds.mockRejectedValue(
			new Error("DB connection lost"),
		);

		await expect(
			service.createBatch(USER_ID, {
				subject: "Fail",
				bodyHtml: "<p>Error</p>",
				scheduledAt: null,
				sources: [{ type: "COLLECTION", collectionId: COLLECTION_ID }],
			}),
		).rejects.toThrow("DB connection lost");

		expect(mockRepo.updateBatchStatus).toHaveBeenCalledWith(BATCH_ID, "FAILED");
	});
});

describe("service.listBatches", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns paginated batch list", async () => {
		const mockBatches = [
			{ id: "b1", subject: "Test", status: "PENDING" },
			{ id: "b2", subject: "Test 2", status: "COMPLETED" },
		];
		mockRepo.findBatches.mockResolvedValue({
			batches: mockBatches,
			total: 2,
		});

		const result = await service.listBatches(USER_ID, {
			page: 1,
			pageSize: 25,
		});

		expect(result.data).toEqual(mockBatches);
		expect(result.total).toBe(2);
		expect(result.page).toBe(1);
		expect(result.pageSize).toBe(25);
	});

	it("passes status filter to repository", async () => {
		mockRepo.findBatches.mockResolvedValue({ batches: [], total: 0 });

		await service.listBatches(USER_ID, {
			status: "SENDING",
			page: 1,
			pageSize: 10,
		});

		expect(mockRepo.findBatches).toHaveBeenCalledWith(USER_ID, {
			status: "SENDING",
			page: 1,
			pageSize: 10,
		});
	});
});

describe("service.getBatch", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns batch when found", async () => {
		const mockBatch = { id: BATCH_ID, subject: "Found", status: "PENDING" };
		mockRepo.findBatchById.mockResolvedValue(mockBatch);

		const result = await service.getBatch(USER_ID, BATCH_ID);
		expect(result).toEqual(mockBatch);
	});

	it("throws BATCH_NOT_FOUND when batch does not exist", async () => {
		mockRepo.findBatchById.mockResolvedValue(null);

		await expect(
			service.getBatch(USER_ID, "nonexistent"),
		).rejects.toThrow(AppError);

		await expect(
			service.getBatch(USER_ID, "nonexistent"),
		).rejects.toThrow("Email batch not found");
	});
});

describe("service.cancelBatch", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("cancels a pending batch", async () => {
		const cancelled = { id: BATCH_ID, status: "CANCELLED" };
		mockRepo.cancelBatch.mockResolvedValue(cancelled);

		const result = await service.cancelBatch(USER_ID, BATCH_ID);
		expect(result).toEqual(cancelled);
	});

	it("throws BATCH_NOT_FOUND_OR_NOT_PENDING when batch cannot be cancelled", async () => {
		mockRepo.cancelBatch.mockResolvedValue(null);

		await expect(
			service.cancelBatch(USER_ID, BATCH_ID),
		).rejects.toThrow(AppError);

		await expect(
			service.cancelBatch(USER_ID, BATCH_ID),
		).rejects.toThrow("Batch not found or is no longer pending");
	});
});

describe("service.getBatchRecipients", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns paginated recipients for an owned batch", async () => {
		mockRepo.findBatchById.mockResolvedValue({ id: BATCH_ID });
		mockRepo.findBatchRecipients.mockResolvedValue({
			recipients: [
				{ id: "r1", recipientEmail: "a@test.com", status: "SENT" },
			],
			total: 1,
		});

		const result = await service.getBatchRecipients(USER_ID, {
			batchId: BATCH_ID,
			page: 1,
			pageSize: 25,
		});

		expect(result.data).toHaveLength(1);
		expect(result.total).toBe(1);
	});

	it("throws BATCH_NOT_FOUND if user does not own the batch", async () => {
		mockRepo.findBatchById.mockResolvedValue(null);

		await expect(
			service.getBatchRecipients(USER_ID, {
				batchId: BATCH_ID,
				page: 1,
				pageSize: 25,
			}),
		).rejects.toThrow("Email batch not found");
	});

	it("passes status filter to repository", async () => {
		mockRepo.findBatchById.mockResolvedValue({ id: BATCH_ID });
		mockRepo.findBatchRecipients.mockResolvedValue({
			recipients: [],
			total: 0,
		});

		await service.getBatchRecipients(USER_ID, {
			batchId: BATCH_ID,
			status: "FAILED",
			page: 1,
			pageSize: 10,
		});

		expect(mockRepo.findBatchRecipients).toHaveBeenCalledWith(BATCH_ID, {
			status: "FAILED",
			page: 1,
			pageSize: 10,
		});
	});
});
