import type { Prisma, EmailBatchStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Pure data-access layer for email batches and recipients. No auth or business logic. */

const BATCH_LIST_SELECT = {
	id: true,
	subject: true,
	totalRecipients: true,
	sentCount: true,
	failedCount: true,
	status: true,
	scheduledAt: true,
	createdAt: true,
} as const;

const BATCH_DETAIL_SELECT = {
	id: true,
	subject: true,
	bodyHtml: true,
	bodyJson: true,
	tiptapReference: true,
	templateId: true,
	ccRecipients: true,
	bccRecipients: true,
	totalRecipients: true,
	sentCount: true,
	failedCount: true,
	status: true,
	scheduledAt: true,
	createdAt: true,
	sources: {
		select: {
			id: true,
			type: true,
			collectionId: true,
			email: true,
			name: true,
		},
	},
} as const;

const RECIPIENT_SELECT = {
	id: true,
	recipientEmail: true,
	recipientName: true,
	status: true,
	sentAt: true,
	failedAt: true,
	failureReason: true,
} as const;

interface FindBatchesParams {
	status?: string;
	page: number;
	pageSize: number;
}

export async function createBatch(
	userId: string,
	data: {
		subject: string;
		bodyHtml: string;
		bodyJson?: Record<string, unknown>;
		tiptapReference?: string;
		templateId?: string;
		ccRecipients: string[];
		bccRecipients: string[];
		scheduledAt: Date | null;
		sources: Array<
			| { type: "COLLECTION"; collectionId: string }
			| { type: "INDIVIDUAL"; email: string; name?: string }
		>;
	},
) {
	return prisma.emailBatch.create({
		data: {
			userId,
			subject: data.subject,
			bodyHtml: data.bodyHtml,
			bodyJson: (data.bodyJson ?? {}) as Prisma.InputJsonValue,
			tiptapReference: data.tiptapReference,
			templateId: data.templateId,
			ccRecipients: data.ccRecipients as unknown as Prisma.InputJsonValue,
			bccRecipients: data.bccRecipients as unknown as Prisma.InputJsonValue,
			scheduledAt: data.scheduledAt,
			sources: {
				create: data.sources.map((s) =>
					s.type === "COLLECTION"
						? { type: "COLLECTION" as const, collectionId: s.collectionId }
						: { type: "INDIVIDUAL" as const, email: s.email, name: s.name },
				),
			},
		},
		select: { id: true, status: true },
	});
}

export async function findBatches(userId: string, params: FindBatchesParams) {
	const where: Prisma.EmailBatchWhereInput = {
		userId,
		...(params.status
			? { status: params.status as Prisma.EnumEmailBatchStatusFilter }
			: {}),
	};

	const [batches, total] = await Promise.all([
		prisma.emailBatch.findMany({
			where,
			select: BATCH_LIST_SELECT,
			orderBy: { createdAt: "desc" },
			skip: (params.page - 1) * params.pageSize,
			take: params.pageSize,
		}),
		prisma.emailBatch.count({ where }),
	]);

	return { batches, total };
}

export async function findBatchById(userId: string, id: string) {
	return prisma.emailBatch.findFirst({
		where: { id, userId },
		select: BATCH_DETAIL_SELECT,
	});
}

export async function cancelBatch(userId: string, id: string) {
	const batch = await prisma.emailBatch.findFirst({
		where: { id, userId, status: { in: ["PENDING", "EXPANDING"] } },
		select: { id: true },
	});

	if (!batch) return null;

	const [updated] = await prisma.$transaction([
		prisma.emailBatch.update({
			where: { id },
			data: { status: "CANCELLED" },
			select: BATCH_LIST_SELECT,
		}),
		prisma.emailSchedule.updateMany({
			where: { batchId: id, status: "PENDING" },
			data: { status: "FAILED", failureReason: "Batch cancelled" },
		}),
	]);

	return updated;
}

export async function updateBatchStatus(id: string, status: EmailBatchStatus) {
	return prisma.emailBatch.update({
		where: { id },
		data: { status },
	});
}

export async function getBatchSources(batchId: string) {
	return prisma.emailBatchSource.findMany({
		where: { batchId },
		select: { id: true, type: true, collectionId: true, email: true, name: true },
	});
}

const RECIPIENT_CHUNK_SIZE = 1000;

export interface RecipientRow {
	email: string;
	name?: string | null;
	mergeData?: Record<string, string | null>;
}

export async function createRecipientRows(
	batchId: string,
	userId: string,
	recipients: Array<RecipientRow>,
) {
	let created = 0;

	for (let i = 0; i < recipients.length; i += RECIPIENT_CHUNK_SIZE) {
		const chunk = recipients.slice(i, i + RECIPIENT_CHUNK_SIZE);
		const result = await prisma.emailSchedule.createMany({
			data: chunk.map((r) => ({
				batchId,
				userId,
				recipientEmail: r.email,
				recipientName: r.name ?? null,
				mergeData: (r.mergeData ?? {}) as Prisma.InputJsonValue,
			})),
		});
		created += result.count;
	}

	return created;
}

export async function updateBatchTotalRecipients(id: string, count: number) {
	return prisma.emailBatch.update({
		where: { id },
		data: { totalRecipients: count },
	});
}

export async function findBatchRecipients(
	batchId: string,
	params: { status?: string; page: number; pageSize: number },
) {
	const where: Prisma.EmailScheduleWhereInput = {
		batchId,
		...(params.status
			? { status: params.status as Prisma.EnumEmailRecipientStatusFilter }
			: {}),
	};

	const [recipients, total] = await Promise.all([
		prisma.emailSchedule.findMany({
			where,
			select: RECIPIENT_SELECT,
			orderBy: { createdAt: "asc" },
			skip: (params.page - 1) * params.pageSize,
			take: params.pageSize,
		}),
		prisma.emailSchedule.count({ where }),
	]);

	return { recipients, total };
}

/** System-context lookup used by the Inngest sender — returns the schedule
 *  row plus its mergeData. Auth is enforced by the event payload upstream. */
export async function findScheduleById(id: string) {
	return prisma.emailSchedule.findUnique({
		where: { id },
		select: {
			id: true,
			batchId: true,
			userId: true,
			recipientEmail: true,
			recipientName: true,
			mergeData: true,
			status: true,
		},
	});
}

/** Returns just the IDs of every PENDING recipient in a batch. Used by the
 *  Inngest dispatcher to fan out send events. */
export async function findPendingRecipientIdsByBatchId(batchId: string) {
	const rows = await prisma.emailSchedule.findMany({
		where: { batchId, status: "PENDING" },
		select: { id: true },
	});
	return rows.map((r) => r.id);
}

/** Used by the sender to decide when the batch is fully terminal. */
export async function countPendingRecipientsByBatchId(batchId: string) {
	return prisma.emailSchedule.count({
		where: { batchId, status: "PENDING" },
	});
}

export async function markRecipientSent(id: string) {
	return prisma.emailSchedule.update({
		where: { id },
		data: { status: "SENT", sentAt: new Date() },
	});
}

export async function markRecipientFailed(id: string, reason: string) {
	return prisma.emailSchedule.update({
		where: { id },
		data: { status: "FAILED", failedAt: new Date(), failureReason: reason },
	});
}

export async function incrementBatchCounters(
	batchId: string,
	sent: number,
	failed: number,
) {
	return prisma.emailBatch.update({
		where: { id: batchId },
		data: {
			sentCount: { increment: sent },
			failedCount: { increment: failed },
		},
	});
}

/** Atomically records a confirmed send: flips the recipient PENDING→SENT,
 *  increments the batch's sentCount, appends the ledger row, and settles 1 unit
 *  of reserved quota — all in ONE transaction.
 *
 *  Idempotent across Inngest step retries: the PENDING→SENT transition is the
 *  gate. If a prior attempt already committed (so the row is no longer PENDING),
 *  the conditional update matches 0 rows and we skip every side effect, so a
 *  retry can't double-count sentCount, duplicate the ledger, or double-settle.
 *  Returns `{ applied }` — false means the work was already done. */
export async function recordSuccessfulSend(args: {
	recipientId: string;
	batchId: string;
	userId: string;
	periodStart: Date;
}) {
	return prisma.$transaction(async (tx) => {
		const transition = await tx.emailSchedule.updateMany({
			where: { id: args.recipientId, status: "PENDING" },
			data: { status: "SENT", sentAt: new Date() },
		});
		if (transition.count === 0) return { applied: false };

		await tx.emailBatch.update({
			where: { id: args.batchId },
			data: { sentCount: { increment: 1 } },
		});
		await tx.emailSendLedger.create({
			data: {
				userId: args.userId,
				batchId: args.batchId,
				recipientId: args.recipientId,
				count: 1,
			},
		});
		await tx.$executeRaw`
			UPDATE "EmailUserUsage"
			SET "settled" = "settled" + 1, "updatedAt" = NOW()
			WHERE "userId" = ${args.userId} AND "periodStart" = ${args.periodStart}
		`;
		return { applied: true };
	});
}

/** Atomically records a failed send: flips the recipient PENDING→FAILED,
 *  increments the batch's failedCount, and releases 1 unit of reserved quota
 *  (the email never went out, so it must not count against the cap or be
 *  billed) — all in ONE transaction.
 *
 *  Idempotent for the same reason as `recordSuccessfulSend`: the PENDING→FAILED
 *  transition gates the counter and quota writes, so a retried `onFailure`
 *  handler can't double-release or inflate failedCount. */
export async function recordFailedSend(args: {
	recipientId: string;
	batchId: string;
	userId: string;
	periodStart: Date;
	reason: string;
}) {
	return prisma.$transaction(async (tx) => {
		const transition = await tx.emailSchedule.updateMany({
			where: { id: args.recipientId, status: "PENDING" },
			data: {
				status: "FAILED",
				failedAt: new Date(),
				failureReason: args.reason,
			},
		});
		if (transition.count === 0) return { applied: false };

		await tx.emailBatch.update({
			where: { id: args.batchId },
			data: { failedCount: { increment: 1 } },
		});
		await tx.$executeRaw`
			UPDATE "EmailUserUsage"
			SET "reserved" = GREATEST("reserved" - 1, 0), "updatedAt" = NOW()
			WHERE "userId" = ${args.userId} AND "periodStart" = ${args.periodStart}
		`;
		return { applied: true };
	});
}

/** Fetches the fields needed for quota enforcement and event tagging. Returns
 *  null only if the user row was deleted between auth and now. */
export async function findUserPlanAndAnchor(userId: string) {
	return prisma.user.findUnique({
		where: { id: userId },
		select: { plan: true, subscriptionStartedAt: true },
	});
}

/** SUMs successful sends since `since` for a single user. Returns 0 when the
 *  user has no rows in the period. NOTE: this is the audit/history view of
 *  usage — it is NOT the quota gate. The cap is enforced atomically via
 *  `reserveQuota` against the `EmailUserUsage` counter; summing the append-only
 *  ledger at check time is what caused the old TOCTOU overshoot. */
export async function sumLedgerSince(userId: string, since: Date) {
	const result = await prisma.emailSendLedger.aggregate({
		where: { userId, createdAt: { gte: since } },
		_sum: { count: true },
	});
	return result._sum.count ?? 0;
}

/** Append-only — one row per successful send. Called from the `mark-sent`
 *  step in the Inngest sender. */
export async function appendLedgerRow(args: {
	userId: string;
	batchId: string;
	recipientId: string;
	count?: number;
}) {
	return prisma.emailSendLedger.create({
		data: {
			userId: args.userId,
			batchId: args.batchId,
			recipientId: args.recipientId,
			count: args.count ?? 1,
		},
	});
}

/** Ensures the usage counter row for a user+period exists before we reserve
 *  against it. `ON CONFLICT DO NOTHING` makes this idempotent and safe under
 *  concurrent expansions — exactly one insert wins, the rest no-op. */
export async function ensureUsageRow(userId: string, periodStart: Date) {
	await prisma.$executeRaw`
		INSERT INTO "EmailUserUsage" ("userId", "periodStart", "reserved", "settled", "updatedAt")
		VALUES (${userId}, ${periodStart}, 0, 0, NOW())
		ON CONFLICT ("userId", "periodStart") DO NOTHING
	`;
}

/** Atomically reserves `amount` against the user's `cap` for the period. The
 *  cap check (`reserved + amount <= cap`) and the debit (`reserved += amount`)
 *  happen in ONE statement, so Postgres serializes concurrent expansions on the
 *  row lock — two batches can't both pass a stale read and overshoot the cap.
 *  This is the fix for the TOCTOU race the SUM-then-act gate had. Returns true
 *  if the reservation was granted, false if it would exceed the cap (0 rows
 *  updated). Call `ensureUsageRow` first so the row is guaranteed to exist. */
export async function reserveQuota(
	userId: string,
	periodStart: Date,
	amount: number,
	cap: number,
): Promise<boolean> {
	const updated = await prisma.$executeRaw`
		UPDATE "EmailUserUsage"
		SET "reserved" = "reserved" + ${amount}, "updatedAt" = NOW()
		WHERE "userId" = ${userId}
		  AND "periodStart" = ${periodStart}
		  AND "reserved" + ${amount} <= ${cap}
	`;
	return updated > 0;
}

/** Releases a previously reserved `amount` (a failed send, or a batch that never
 *  dispatched). `GREATEST(..., 0)` clamps at zero so a double-release can never
 *  drive the counter negative. */
export async function releaseQuota(
	userId: string,
	periodStart: Date,
	amount: number,
) {
	await prisma.$executeRaw`
		UPDATE "EmailUserUsage"
		SET "reserved" = GREATEST("reserved" - ${amount}, 0), "updatedAt" = NOW()
		WHERE "userId" = ${userId} AND "periodStart" = ${periodStart}
	`;
}

/** Records `amount` confirmed sends. `settled` is the number billing reads —
 *  reservations only gate the cap, settled is what actually left. */
export async function settleQuota(
	userId: string,
	periodStart: Date,
	amount: number,
) {
	await prisma.$executeRaw`
		UPDATE "EmailUserUsage"
		SET "settled" = "settled" + ${amount}, "updatedAt" = NOW()
		WHERE "userId" = ${userId} AND "periodStart" = ${periodStart}
	`;
}
