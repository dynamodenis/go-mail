import { z } from "zod";

/** Schema for creating an email batch (used by both "Schedule" and "Send All") */
export const createEmailBatchSchema = z.object({
	subject: z.string().min(1, "Subject is required").max(255),
	bodyHtml: z.string().min(1, "Email body is required"),
	bodyJson: z.record(z.unknown()).optional(),
	tiptapReference: z.string().optional(),
	templateId: z.string().uuid().optional(),
	ccRecipients: z.array(z.string().email()).optional(),
	bccRecipients: z.array(z.string().email()).optional(),
	scheduledAt: z.string().datetime().nullable(),
	sources: z
		.array(
			z.discriminatedUnion("type", [
				z.object({
					type: z.literal("COLLECTION"),
					collectionId: z.string().uuid(),
				}),
				z.object({
					type: z.literal("INDIVIDUAL"),
					email: z.string().email(),
					name: z.string().optional(),
				}),
			]),
		)
		.min(1, "At least one recipient source is required"),
});

export type CreateEmailBatchInput = z.infer<typeof createEmailBatchSchema>;

export type BatchSource = CreateEmailBatchInput["sources"][number];

export const cancelEmailBatchSchema = z.object({
	id: z.string().uuid(),
});

export const emailBatchFiltersSchema = z.object({
	status: z
		.enum([
			"PENDING",
			"EXPANDING",
			"SENDING",
			"COMPLETED",
			"FAILED",
			"CANCELLED",
		])
		.optional(),
	page: z.coerce.number().int().positive().default(1),
	pageSize: z.coerce.number().int().positive().max(100).default(25),
});

export type EmailBatchFilters = z.infer<typeof emailBatchFiltersSchema>;

export const emailBatchRecipientsSchema = z.object({
	batchId: z.string().uuid(),
	status: z.enum(["PENDING", "SENT", "FAILED"]).optional(),
	page: z.coerce.number().int().positive().default(1),
	pageSize: z.coerce.number().int().positive().max(100).default(25),
});

export type EmailBatchRecipientsFilters = z.infer<
	typeof emailBatchRecipientsSchema
>;

export interface EmailBatchItem {
	id: string;
	subject: string;
	totalRecipients: number;
	sentCount: number;
	failedCount: number;
	status: string;
	scheduledAt: string | null;
	createdAt: string;
}

export interface EmailBatchDetail extends EmailBatchItem {
	bodyHtml: string;
	bodyJson: Record<string, unknown>;
	tiptapReference: string | null;
	templateId: string | null;
	ccRecipients: string[];
	bccRecipients: string[];
	sources: EmailBatchSourceItem[];
}

export interface EmailBatchSourceItem {
	id: string;
	type: "COLLECTION" | "INDIVIDUAL";
	collectionId: string | null;
	email: string | null;
	name: string | null;
}

export interface EmailBatchRecipient {
	id: string;
	recipientEmail: string;
	recipientName: string | null;
	status: string;
	sentAt: string | null;
	failedAt: string | null;
	failureReason: string | null;
}
