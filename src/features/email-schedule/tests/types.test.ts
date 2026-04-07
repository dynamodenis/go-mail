import { describe, it, expect } from "vitest";
import {
	createEmailBatchSchema,
	cancelEmailBatchSchema,
	emailBatchFiltersSchema,
	emailBatchRecipientsSchema,
} from "../types";

describe("createEmailBatchSchema", () => {
	const validInput = {
		subject: "Weekly Newsletter",
		bodyHtml: "<p>Hello</p>",
		scheduledAt: null,
		sources: [{ type: "INDIVIDUAL" as const, email: "test@example.com" }],
	};

	it("accepts valid input with individual source", () => {
		const result = createEmailBatchSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it("accepts valid input with collection source", () => {
		const result = createEmailBatchSchema.safeParse({
			...validInput,
			sources: [
				{
					type: "COLLECTION",
					collectionId: "123e4567-e89b-12d3-a456-426614174000",
				},
			],
		});
		expect(result.success).toBe(true);
	});

	it("accepts mixed sources (collection + individual)", () => {
		const result = createEmailBatchSchema.safeParse({
			...validInput,
			sources: [
				{
					type: "COLLECTION",
					collectionId: "123e4567-e89b-12d3-a456-426614174000",
				},
				{ type: "INDIVIDUAL", email: "bob@example.com", name: "Bob" },
			],
		});
		expect(result.success).toBe(true);
	});

	it("accepts scheduledAt as ISO datetime string", () => {
		const result = createEmailBatchSchema.safeParse({
			...validInput,
			scheduledAt: "2026-12-25T09:00:00.000Z",
		});
		expect(result.success).toBe(true);
	});

	it("accepts optional cc and bcc recipients", () => {
		const result = createEmailBatchSchema.safeParse({
			...validInput,
			ccRecipients: ["cc@example.com"],
			bccRecipients: ["bcc@example.com"],
		});
		expect(result.success).toBe(true);
	});

	it("accepts optional templateId as uuid", () => {
		const result = createEmailBatchSchema.safeParse({
			...validInput,
			templateId: "123e4567-e89b-12d3-a456-426614174000",
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty subject", () => {
		const result = createEmailBatchSchema.safeParse({
			...validInput,
			subject: "",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe("Subject is required");
		}
	});

	it("rejects subject over 255 characters", () => {
		const result = createEmailBatchSchema.safeParse({
			...validInput,
			subject: "a".repeat(256),
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty bodyHtml", () => {
		const result = createEmailBatchSchema.safeParse({
			...validInput,
			bodyHtml: "",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe("Email body is required");
		}
	});

	it("rejects empty sources array", () => {
		const result = createEmailBatchSchema.safeParse({
			...validInput,
			sources: [],
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe(
				"At least one recipient source is required",
			);
		}
	});

	it("rejects individual source with invalid email", () => {
		const result = createEmailBatchSchema.safeParse({
			...validInput,
			sources: [{ type: "INDIVIDUAL", email: "not-an-email" }],
		});
		expect(result.success).toBe(false);
	});

	it("rejects collection source without collectionId", () => {
		const result = createEmailBatchSchema.safeParse({
			...validInput,
			sources: [{ type: "COLLECTION" }],
		});
		expect(result.success).toBe(false);
	});

	it("rejects collection source with invalid uuid", () => {
		const result = createEmailBatchSchema.safeParse({
			...validInput,
			sources: [{ type: "COLLECTION", collectionId: "not-a-uuid" }],
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid scheduledAt format", () => {
		const result = createEmailBatchSchema.safeParse({
			...validInput,
			scheduledAt: "next tuesday",
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid cc email addresses", () => {
		const result = createEmailBatchSchema.safeParse({
			...validInput,
			ccRecipients: ["not-email"],
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid templateId format", () => {
		const result = createEmailBatchSchema.safeParse({
			...validInput,
			templateId: "not-a-uuid",
		});
		expect(result.success).toBe(false);
	});
});

describe("cancelEmailBatchSchema", () => {
	it("accepts valid uuid", () => {
		const result = cancelEmailBatchSchema.safeParse({
			id: "123e4567-e89b-12d3-a456-426614174000",
		});
		expect(result.success).toBe(true);
	});

	it("rejects non-uuid string", () => {
		const result = cancelEmailBatchSchema.safeParse({ id: "abc" });
		expect(result.success).toBe(false);
	});

	it("rejects missing id", () => {
		const result = cancelEmailBatchSchema.safeParse({});
		expect(result.success).toBe(false);
	});
});

describe("emailBatchFiltersSchema", () => {
	it("applies defaults for page and pageSize", () => {
		const result = emailBatchFiltersSchema.parse({});
		expect(result.page).toBe(1);
		expect(result.pageSize).toBe(25);
	});

	it("accepts valid status filter", () => {
		const result = emailBatchFiltersSchema.safeParse({ status: "PENDING" });
		expect(result.success).toBe(true);
	});

	it("accepts all valid statuses", () => {
		for (const status of [
			"PENDING",
			"EXPANDING",
			"SENDING",
			"COMPLETED",
			"FAILED",
			"CANCELLED",
		]) {
			const result = emailBatchFiltersSchema.safeParse({ status });
			expect(result.success).toBe(true);
		}
	});

	it("rejects invalid status", () => {
		const result = emailBatchFiltersSchema.safeParse({ status: "UNKNOWN" });
		expect(result.success).toBe(false);
	});

	it("rejects pageSize over 100", () => {
		const result = emailBatchFiltersSchema.safeParse({ pageSize: 101 });
		expect(result.success).toBe(false);
	});

	it("rejects page 0 or negative", () => {
		const result = emailBatchFiltersSchema.safeParse({ page: 0 });
		expect(result.success).toBe(false);
	});
});

describe("emailBatchRecipientsSchema", () => {
	const validBatchId = "123e4567-e89b-12d3-a456-426614174000";

	it("accepts valid input with batchId", () => {
		const result = emailBatchRecipientsSchema.safeParse({
			batchId: validBatchId,
		});
		expect(result.success).toBe(true);
	});

	it("applies defaults for page and pageSize", () => {
		const result = emailBatchRecipientsSchema.parse({
			batchId: validBatchId,
		});
		expect(result.page).toBe(1);
		expect(result.pageSize).toBe(25);
	});

	it("accepts recipient status filters", () => {
		for (const status of ["PENDING", "SENT", "FAILED"]) {
			const result = emailBatchRecipientsSchema.safeParse({
				batchId: validBatchId,
				status,
			});
			expect(result.success).toBe(true);
		}
	});

	it("rejects invalid batchId", () => {
		const result = emailBatchRecipientsSchema.safeParse({
			batchId: "not-uuid",
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid recipient status", () => {
		const result = emailBatchRecipientsSchema.safeParse({
			batchId: validBatchId,
			status: "SENDING",
		});
		expect(result.success).toBe(false);
	});
});
