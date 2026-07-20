import {
	getGrantIdForAccount,
	getPrimaryGrantId,
} from "@/features/settings/api/service";
import { AppError, handleServerError } from "@/lib/errors";
import { isNylasConfigured } from "@/lib/nylas";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireUserId } from "@/lib/require-user";
import { createServerFn } from "@tanstack/react-start";
import {
	type ArchiveThreadInput,
	EMAIL_ERROR,
	type EmailThreadDetailQuery,
	type EmailThreadsQuery,
	MAX_ATTACHMENT_TOTAL_BYTES,
	archiveThreadSchema,
	emailThreadDetailQuerySchema,
	emailThreadsQuerySchema,
	sendEmailPayloadSchema,
} from "../types";
import * as service from "./service";

/** Resolves the signed-in user's mailbox grant — the primary one by default,
 *  or a specific connected account's (ownership-checked) when `accountId` is
 *  given. Throws the expected "not configured / not connected" errors the UI
 *  turns into a connect CTA. */
async function requireGrantId(accountId?: string | null): Promise<string> {
	const userId = await requireUserId();
	if (!isNylasConfigured()) {
		throw new AppError(
			EMAIL_ERROR.NOT_CONFIGURED,
			"Email isn't configured on this server yet.",
		);
	}
	const grantId = accountId
		? await getGrantIdForAccount(userId, accountId)
		: await getPrimaryGrantId(userId);
	if (!grantId) {
		throw new AppError(
			EMAIL_ERROR.NOT_CONNECTED,
			"Connect an email account in Settings → Integrations to use the inbox.",
		);
	}
	return grantId;
}

/**
 * List the user's mailbox folders (curated: system folders + user folders,
 * provider noise filtered out) for the email sidebar.
 * @auth Required
 * @throws NYLAS_NOT_CONFIGURED, NYLAS_NOT_CONNECTED, EMAIL_FETCH_FAILED
 */
export const getEmailFolders = createServerFn({ method: "GET" }).handler(
	async () => {
		try {
			const grantId = await requireGrantId();
			return { data: await service.getFolders(grantId) };
		} catch (error) {
			return handleServerError(error);
		}
	},
);

/**
 * List threads in a folder on the user's primary mailbox, optionally filtered
 * by a search query. `role` tunes the list-row preview (sender vs recipient).
 * @auth Required
 * @throws NYLAS_NOT_CONFIGURED, NYLAS_NOT_CONNECTED, EMAIL_FETCH_FAILED
 */
export const getEmailThreads = createServerFn({ method: "GET" })
	.inputValidator((data: EmailThreadsQuery) =>
		emailThreadsQuerySchema.parse(data),
	)
	.handler(async ({ data }) => {
		try {
			const grantId = await requireGrantId();
			return {
				data: await service.getThreads(
					grantId,
					data.folderId,
					data.role,
					data.search,
				),
			};
		} catch (error) {
			return handleServerError(error);
		}
	});

/**
 * Mark a thread "Done": archive it on the user's primary mailbox (drop the
 * inbox label, or move to the provider's archive folder).
 * @auth Required
 * @throws NYLAS_NOT_CONFIGURED, NYLAS_NOT_CONNECTED, EMAIL_UPDATE_FAILED
 */
export const archiveEmailThread = createServerFn({ method: "POST" })
	.inputValidator((data: ArchiveThreadInput) => archiveThreadSchema.parse(data))
	.handler(async ({ data }) => {
		try {
			const grantId = await requireGrantId();
			await service.archiveThread(grantId, data.threadId);
			return { data: { threadId: data.threadId } };
		} catch (error) {
			return handleServerError(error);
		}
	});

/**
 * Get a single thread's messages for the reading pane.
 * @auth Required
 * @throws NYLAS_NOT_CONFIGURED, NYLAS_NOT_CONNECTED, EMAIL_FETCH_FAILED
 */
export const getEmailThreadDetail = createServerFn({ method: "GET" })
	.inputValidator((data: EmailThreadDetailQuery) =>
		emailThreadDetailQuerySchema.parse(data),
	)
	.handler(async ({ data }) => {
		try {
			const grantId = await requireGrantId();
			return {
				data: await service.getThreadDetail(grantId, data.threadId),
			};
		} catch (error) {
			return handleServerError(error);
		}
	});

// Sending is the platform's outward-facing write — bound it per user
// (CLAUDE.md: rate limit write server functions).
const SEND_LIMIT_PER_MINUTE = 10;
const SEND_LIMIT_WINDOW_MS = 60_000;

/**
 * Send an email from one of the user's connected mailboxes. Arrives as
 * FormData so attachments ride along as raw Files: a `payload` field carries
 * the JSON scalar fields (validated by sendEmailPayloadSchema) and repeated
 * `attachments` entries carry the files (25 MB total, re-checked here — the
 * client gate is advisory only).
 * @auth Required
 * @throws NYLAS_NOT_CONFIGURED, NYLAS_NOT_CONNECTED, EMAIL_RATE_LIMITED, EMAIL_SEND_FAILED
 */
export const sendEmail = createServerFn({ method: "POST" })
	.inputValidator((data: FormData) => {
		const payload = sendEmailPayloadSchema.parse(
			JSON.parse(String(data.get("payload") ?? "{}")),
		);
		const files = data
			.getAll("attachments")
			.filter((entry): entry is File => entry instanceof File);
		const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
		if (totalBytes > MAX_ATTACHMENT_TOTAL_BYTES) {
			throw new AppError(
				EMAIL_ERROR.SEND_FAILED,
				"Attachments are limited to 25 MB in total.",
			);
		}
		return { payload, files };
	})
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			if (
				!checkRateLimit(
					`send-email:${userId}`,
					SEND_LIMIT_PER_MINUTE,
					SEND_LIMIT_WINDOW_MS,
				)
			) {
				throw new AppError(
					EMAIL_ERROR.RATE_LIMITED,
					"You're sending too quickly — wait a minute and try again.",
				);
			}
			const grantId = await requireGrantId(data.payload.fromAccountId);
			await service.sendEmail(grantId, data.payload, data.files);
			return { data: { sent: true } };
		} catch (error) {
			return handleServerError(error);
		}
	});
