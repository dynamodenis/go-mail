import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUserId } from "@/lib/require-user";
import {
	createEmailBatchSchema,
	cancelEmailBatchSchema,
	emailBatchFiltersSchema,
	emailBatchRecipientsSchema,
} from "../types";
import * as service from "./service";

/**
 * Create a new email batch (used by both "Schedule" and "Send All").
 * scheduledAt = null means send immediately; a date means schedule for later.
 * @auth Required
 * @throws SCHEDULE_IN_PAST
 */
export const createEmailBatch = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			subject: string;
			bodyHtml: string;
			bodyJson?: Record<string, unknown>;
			tiptapReference?: string;
			templateId?: string;
			ccRecipients?: string[];
			bccRecipients?: string[];
			scheduledAt: string | null;
			sources: Array<
				| { type: "COLLECTION"; collectionId: string }
				| { type: "INDIVIDUAL"; email: string; name?: string }
			>;
		}) => createEmailBatchSchema.parse(data),
	)
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		return { data: await service.createBatch(userId, data) };
	});

/**
 * Get a paginated list of email batches for the current user.
 * @auth Required
 */
export const getEmailBatches = createServerFn({ method: "GET" })
	.inputValidator(
		(data: { status?: string; page?: number; pageSize?: number }) =>
			emailBatchFiltersSchema.parse(data),
	)
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		return { data: await service.listBatches(userId, data) };
	});

/**
 * Get a single email batch by ID with sources.
 * @auth Required
 * @throws BATCH_NOT_FOUND
 */
export const getEmailBatchById = createServerFn({ method: "GET" })
	.inputValidator((data: { id: string }) =>
		z.object({ id: z.string().uuid() }).parse(data),
	)
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		return { data: await service.getBatch(userId, data.id) };
	});

/**
 * Cancel a pending email batch and its unsent recipients.
 * @auth Required
 * @throws BATCH_NOT_FOUND_OR_NOT_PENDING
 */
export const cancelEmailBatch = createServerFn({ method: "POST" })
	.inputValidator((data: { id: string }) =>
		cancelEmailBatchSchema.parse(data),
	)
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		return { data: await service.cancelBatch(userId, data.id) };
	});

/**
 * Get paginated recipients for an email batch.
 * @auth Required
 * @throws BATCH_NOT_FOUND
 */
export const getEmailBatchRecipients = createServerFn({ method: "GET" })
	.inputValidator(
		(data: {
			batchId: string;
			status?: string;
			page?: number;
			pageSize?: number;
		}) => emailBatchRecipientsSchema.parse(data),
	)
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		return { data: await service.getBatchRecipients(userId, data) };
	});
