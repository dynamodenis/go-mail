import { NonRetriableError } from "inngest";
import {
	inngest,
	type BatchCreatedData,
	type RecipientSendData,
} from "@/lib/inngest";
import { resend, RESEND_FROM_EMAIL, RESEND_RPS } from "@/lib/resend";
import { resolveTemplateHtml } from "@/features/email-templates/utils/resolve-merge-tags";
import * as repo from "../api/repository";

/** Max recipient events published per `step.sendEvent` call. Keeps each fan-out
 *  request under Inngest's payload-size limit so a large batch dispatches across
 *  several bounded sends instead of one oversized (and rejected) request. */
const FAN_OUT_CHUNK_SIZE = 1000;

/** Marks a batch COMPLETED once no PENDING recipients remain. Idempotent — if
 *  two recipients finish concurrently and both call this, the duplicate write
 *  is harmless. */
async function maybeFinalizeBatch(batchId: string) {
	const remaining = await repo.countPendingRecipientsByBatchId(batchId);
	if (remaining === 0) {
		await repo.updateBatchStatus(batchId, "COMPLETED");
	}
}

/**
 * Triggered after a batch is created. Sleeps until `scheduledAt` if set, then
 * fans out one `email/recipient.send` event per pending recipient.
 *
 * Inngest auto-retries this function on transient failures.
 */
export const dispatchBatch = inngest.createFunction(
	{
		id: "dispatch-batch",
		triggers: [{ event: "email/batch.created" }],
	},
	async ({ event, step }) => {
		const { batchId, userId, tier, periodStart } =
			event.data as BatchCreatedData;

		const batch = await step.run("load-batch", () =>
			repo.findBatchById(userId, batchId),
		);
		if (!batch) {
			return { skipped: "batch-not-found" };
		}

		// Hold the run open until the scheduled send time.
		if (batch.scheduledAt && new Date(batch.scheduledAt) > new Date()) {
			await step.sleepUntil(
				"wait-for-scheduled-time",
				new Date(batch.scheduledAt),
			);
		}

		const recipientIds = await step.run("load-pending-recipients", () =>
			repo.findPendingRecipientIdsByBatchId(batchId),
		);

		if (recipientIds.length === 0) {
			await step.run("mark-completed", () =>
				repo.updateBatchStatus(batchId, "COMPLETED"),
			);
			return { dispatched: 0 };
		}

		// Fan out in chunks. A single `sendEvent` with tens of thousands of
		// events would exceed Inngest's per-request payload limit and fail the
		// whole dispatch, so we publish in bounded batches. Each chunk is its own
		// memoized step — if dispatch is retried, already-sent chunks are skipped.
		for (let i = 0; i < recipientIds.length; i += FAN_OUT_CHUNK_SIZE) {
			const chunk = recipientIds.slice(i, i + FAN_OUT_CHUNK_SIZE);
			await step.sendEvent(
				`fan-out-${i}`,
				chunk.map((recipientId: string) => ({
					name: "email/recipient.send" as const,
					data: {
						batchId,
						recipientId,
						userId,
						tier,
						periodStart,
					} satisfies RecipientSendData,
				})),
			);
		}

		return { dispatched: recipientIds.length };
	},
);

/**
 * Sends a single recipient's email via Resend.
 *
 * Multi-tenant scaling controls (all driven by tier on the event payload):
 * - **Throttle key** uses a shared `tier:FREE` bucket so all free users together
 *   are capped at RESEND_RPS/sec, while each paid user gets their own bucket
 *   (`user:<id>`) at RESEND_RPS/sec — paid users don't share rate budget with
 *   the free pool, free users can't starve them.
 * - **Concurrency** — a global cap protects the Resend API from total parallel
 *   blast, plus a per-user cap prevents one user's batch from dominating workers.
 * - **Priority.run** schedules paid events ahead of free events whenever there's
 *   any contention, so a paid user queued behind a free batch jumps the line.
 *
 * Reliability:
 * - Retries up to 3 times on transient errors. After exhausting retries,
 *   `onFailure` marks the recipient FAILED so the batch can finalize.
 * - Idempotent: if a recipient is no longer PENDING (already sent / cancelled),
 *   the function returns early without sending.
 */
export const sendEmailToRecipient = inngest.createFunction(
	{
		id: "send-email-to-recipient",
		triggers: [{ event: "email/recipient.send" }],
		throttle: {
			limit: RESEND_RPS,
			period: "1s",
			// Free users share one bucket; paid users get individual buckets.
			key: "event.data.tier == 'FREE' ? 'tier:FREE' : 'user:' + event.data.userId",
		},
		concurrency: [
			// Global parallel cap across all sends — keep below your Resend
			// concurrency budget. Adjust as you scale.
			{ limit: 50, scope: "fn" },
			// Per-user fairness cap on parallel sends.
			{ limit: 10, scope: "fn", key: "event.data.userId" },
		],
		priority: {
			// Higher = scheduled sooner. Paid events leapfrog free.
			run: "event.data.tier == 'FREE' ? 0 : 100",
		},
		retries: 3,
		onFailure: async ({ event, error }) => {
			// `event` is the `inngest/function.failed` wrapper; the original
			// event lives at `event.data.event`.
			const original = (
				event.data as { event: { data: RecipientSendData } }
			).event;
			const { batchId, recipientId, userId, periodStart } = original.data;

			// Single transaction: flip the recipient FAILED, bump failedCount, and
			// release the reserved slot (this email never went out, so it must not
			// count against the cap or be billed). Idempotent — a retried failure
			// handler that finds the row already terminal is a no-op.
			await repo.recordFailedSend({
				recipientId,
				batchId,
				userId,
				periodStart: new Date(periodStart),
				reason: error.message.slice(0, 500),
			});
			await maybeFinalizeBatch(batchId);
		},
	},
	async ({ event, step }) => {
		const { batchId, recipientId, userId, periodStart } =
			event.data as RecipientSendData;

		const recipient = await step.run("load-recipient", () =>
			repo.findScheduleById(recipientId),
		);
		if (!recipient) {
			throw new NonRetriableError("Recipient row not found");
		}
		if (recipient.status !== "PENDING") {
			return { skipped: recipient.status };
		}

		const batch = await step.run("load-batch", () =>
			repo.findBatchById(userId, batchId),
		);
		if (!batch) {
			throw new NonRetriableError("Parent batch not found");
		}

		const merge = (recipient.mergeData ?? {}) as Record<
			string,
			string | null
		>;
		const html = resolveTemplateHtml(batch.bodyHtml, {
			firstName: merge.firstName,
			lastName: merge.lastName,
			email: merge.email ?? recipient.recipientEmail,
			company: merge.company,
		});

		const cc = (batch.ccRecipients as string[] | undefined) ?? [];
		const bcc = (batch.bccRecipients as string[] | undefined) ?? [];

		await step.run("send-via-resend", async () => {
			// Dry run: set EMAIL_DRY_RUN=true in .env to skip the real Resend
			// call during local testing so send credits aren't spent. The step
			// still runs (visible in the Inngest dashboard) and downstream
			// mark-sent / settle proceed as if the send succeeded.
			if (process.env.EMAIL_DRY_RUN === "true") {
				return { dryRun: true, to: recipient.recipientEmail };
			}
			if (!RESEND_FROM_EMAIL) {
				throw new NonRetriableError("RESEND_FROM_EMAIL is not configured");
			}
			const { error } = await resend.emails.send({
				from: RESEND_FROM_EMAIL,
				to: recipient.recipientEmail,
				subject: batch.subject,
				html,
				...(cc.length > 0 && { cc }),
				...(bcc.length > 0 && { bcc }),
			});
			if (error) {
				throw new Error(`Resend ${error.name}: ${error.message}`);
			}
		});

		await step.run("mark-sent", async () => {
			// Single transaction gated on the PENDING→SENT transition: marks the
			// recipient sent, bumps sentCount, appends the audit ledger row, and
			// settles the reservation (already reserved at expand time, so this
			// never changes the cap — it records what actually went out). Gating
			// on the transition makes a retried step idempotent: no double count,
			// no duplicate ledger row, no double settle.
			await repo.recordSuccessfulSend({
				recipientId,
				batchId,
				userId,
				periodStart: new Date(periodStart),
			});
		});

		await step.run("maybe-finalize", () => maybeFinalizeBatch(batchId));

		return { sent: recipient.recipientEmail };
	},
);

export const functions = [dispatchBatch, sendEmailToRecipient];
