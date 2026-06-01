import { NonRetriableError } from "inngest";
import {
	inngest,
	type BatchCreatedData,
	type RecipientSendData,
} from "@/lib/inngest";
import { resend, RESEND_FROM_EMAIL, RESEND_RPS } from "@/lib/resend";
import { resolveTemplateHtml } from "@/features/email-templates/utils/resolve-merge-tags";
import * as repo from "../api/repository";

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

		await step.sendEvent(
			"fan-out",
			recipientIds.map((recipientId: string) => ({
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

			await repo.markRecipientFailed(
				recipientId,
				error.message.slice(0, 500),
			);
			await repo.incrementBatchCounters(batchId, 0, 1);
			// Release the reserved slot — this email never went out, so it must
			// not count against the cap or be billed. Releasing frees the slot
			// for another send this period.
			await repo.releaseQuota(userId, new Date(periodStart), 1);
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
			await repo.markRecipientSent(recipientId);
			await repo.incrementBatchCounters(batchId, 1, 0);
			// Append to the usage ledger (kept for per-send audit/history).
			await repo.appendLedgerRow({ userId, batchId, recipientId });
			// Settle the reservation: this confirmed send is now billable. The
			// slot was already reserved at expand time, so settling never
			// changes the cap — it just records what actually went out.
			await repo.settleQuota(userId, new Date(periodStart), 1);
		});

		await step.run("maybe-finalize", () => maybeFinalizeBatch(batchId));

		return { sent: recipient.recipientEmail };
	},
);

export const functions = [dispatchBatch, sendEmailToRecipient];
