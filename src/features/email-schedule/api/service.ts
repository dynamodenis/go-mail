import { AppError } from "@/lib/errors";
import { inngest } from "@/lib/inngest";
import * as repo from "./repository";
import * as collectionsRepo from "@/features/collections/api/repository";
import type {
	CreateEmailBatchInput,
	EmailBatchFilters,
	EmailBatchRecipientsFilters,
} from "../types";

/** Business logic for email batches. No HTTP or Prisma concerns. */

export async function createBatch(
	userId: string,
	input: CreateEmailBatchInput,
) {
	const scheduledAt = input.scheduledAt
		? new Date(input.scheduledAt)
		: null;

	if (scheduledAt && scheduledAt <= new Date()) {
		throw new AppError("SCHEDULE_IN_PAST", "Scheduled time must be in the future");
	}

	const batch = await repo.createBatch(userId, {
		subject: input.subject,
		bodyHtml: input.bodyHtml,
		bodyJson: input.bodyJson,
		tiptapReference: input.tiptapReference,
		templateId: input.templateId,
		ccRecipients: input.ccRecipients ?? [],
		bccRecipients: input.bccRecipients ?? [],
		scheduledAt,
		sources: input.sources,
	});

	await expandBatch(batch.id, userId, input.sources);

	return { id: batch.id, status: batch.status };
}

interface ExpandedRecipient {
	email: string;
	name: string | null;
	mergeData: Record<string, string | null>;
}

async function expandBatch(
	batchId: string,
	userId: string,
	sources: CreateEmailBatchInput["sources"],
) {
	await repo.updateBatchStatus(batchId, "EXPANDING");

	try {
		const recipientMap = new Map<string, ExpandedRecipient>();

		for (const source of sources) {
			if (source.type === "COLLECTION") {
				const contactIds = await collectionsRepo.getCollectionContactIds(
					userId,
					source.collectionId,
				);
				if (contactIds.length > 0) {
					const contacts =
						await collectionsRepo.getContactEmailsByIds(contactIds);
					for (const c of contacts) {
						if (!recipientMap.has(c.email)) {
							const name = [c.firstName, c.lastName]
								.filter(Boolean)
								.join(" ") || null;
							recipientMap.set(c.email, {
								email: c.email,
								name,
								mergeData: {
									firstName: c.firstName,
									lastName: c.lastName,
									name,
									email: c.email,
									company: c.company,
								},
							});
						}
					}
				}
			} else {
				if (!recipientMap.has(source.email)) {
					const name = source.name ?? null;
					recipientMap.set(source.email, {
						email: source.email,
						name,
						mergeData: {
							firstName: null,
							lastName: null,
							name,
							email: source.email,
							company: null,
						},
					});
				}
			}
		}

		const recipients = Array.from(recipientMap.values());

		if (recipients.length === 0) {
			await repo.updateBatchStatus(batchId, "FAILED");
			return;
		}

		const created = await repo.createRecipientRows(batchId, userId, recipients);
		await repo.updateBatchTotalRecipients(batchId, created);

		// PENDING = waiting for scheduledAt, SENDING = ready for immediate send
		const batch = await repo.findBatchById(userId, batchId);
		const nextStatus = batch?.scheduledAt ? "PENDING" : "SENDING";
		await repo.updateBatchStatus(batchId, nextStatus);

		// Hand off to Inngest. The dispatcher function will sleep until
		// `scheduledAt` if needed, then fan out one send event per recipient.
		await inngest.send({
			name: "email/batch.created",
			data: { batchId, userId },
		});
	} catch (error) {
		await repo.updateBatchStatus(batchId, "FAILED");
		throw error;
	}
}

export async function listBatches(
	userId: string,
	filters: EmailBatchFilters,
) {
	const { batches, total } = await repo.findBatches(userId, {
		status: filters.status,
		page: filters.page,
		pageSize: filters.pageSize,
	});

	return {
		data: batches,
		total,
		page: filters.page,
		pageSize: filters.pageSize,
	};
}

export async function getBatch(userId: string, id: string) {
	const batch = await repo.findBatchById(userId, id);
	if (!batch) {
		throw new AppError("BATCH_NOT_FOUND", "Email batch not found");
	}
	return batch;
}

export async function cancelBatch(userId: string, id: string) {
	const cancelled = await repo.cancelBatch(userId, id);
	if (!cancelled) {
		throw new AppError(
			"BATCH_NOT_FOUND_OR_NOT_PENDING",
			"Batch not found or is no longer pending",
		);
	}
	return cancelled;
}

export async function getBatchRecipients(
	userId: string,
	filters: EmailBatchRecipientsFilters,
) {
	// Verify user owns the batch
	const batch = await repo.findBatchById(userId, filters.batchId);
	if (!batch) {
		throw new AppError("BATCH_NOT_FOUND", "Email batch not found");
	}

	const { recipients, total } = await repo.findBatchRecipients(
		filters.batchId,
		{
			status: filters.status,
			page: filters.page,
			pageSize: filters.pageSize,
		},
	);

	return {
		data: recipients,
		total,
		page: filters.page,
		pageSize: filters.pageSize,
	};
}
