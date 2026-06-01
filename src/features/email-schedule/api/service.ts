import { AppError } from "@/lib/errors";
import { inngest } from "@/lib/inngest";
import { currentPeriodStart, quotaFor } from "@/lib/quota";
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

	// Track the quota we reserve so the catch can hand it back if the batch
	// fails before any email is actually sent. Set once the reservation lands.
	let reservedAmount = 0;
	let periodStart: Date | null = null;

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

		// Enforce the monthly send quota for the user's current billing cycle
		// before publishing the dispatch event. We check here (rather than at
		// the API edge) because we now know the exact recipient count after
		// dedup. A failed quota gate marks the batch FAILED so it shows up in
		// the UI with the right status — recipient rows are kept for audit.
		const user = await repo.findUserPlanAndAnchor(userId);
		if (!user) {
			throw new AppError("USER_NOT_FOUND", "User account not found");
		}
		periodStart = currentPeriodStart(user.subscriptionStartedAt);
		const cap = quotaFor(user.plan);

		// Reserve atomically: the cap check and the debit are a single DB
		// statement, so two batches expanding at once serialize on the row lock
		// instead of both passing a stale read and overshooting the cap. The
		// reservation (not the send) is what guards real cost — money isn't
		// spent on a send we already know exceeds the plan.
		await repo.ensureUsageRow(userId, periodStart);
		const reserved = await repo.reserveQuota(userId, periodStart, created, cap);
		if (!reserved) {
			await repo.updateBatchStatus(batchId, "FAILED");
			throw new AppError(
				"QUOTA_EXCEEDED",
				`This batch needs ${created} emails but would exceed your ${cap} monthly cap. Upgrade your plan to continue.`,
			);
		}
		reservedAmount = created;

		// PENDING = waiting for scheduledAt, SENDING = ready for immediate send
		const batch = await repo.findBatchById(userId, batchId);
		const nextStatus = batch?.scheduledAt ? "PENDING" : "SENDING";
		await repo.updateBatchStatus(batchId, nextStatus);

		// Hand off to Inngest. The dispatcher function will sleep until
		// `scheduledAt` if needed, then fan out one send event per recipient.
		// `tier` rides the event so throttle/priority expressions can branch
		// without re-querying the DB.
		await inngest.send({
			name: "email/batch.created",
			data: {
				batchId,
				userId,
				tier: user.plan,
				// Carry the exact period the reservation was made against so the
				// sender settles/releases the same EmailUserUsage row — no recompute drift if a send crosses the billing anniversary.
				periodStart: periodStart.toISOString(),
			},
		});
	} catch (error) {
		// Hand back any quota we reserved — at this point nothing has been sent
		// (dispatch is the last step), so the reservation is pure overhead.
		// Per-recipient failures release their own slot later in the sender.
		if (reservedAmount > 0 && periodStart) {
			await repo.releaseQuota(userId, periodStart, reservedAmount);
		}
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
