import { getPrimaryGrantId } from "@/features/settings/api/service";
import { AppError, handleServerError } from "@/lib/errors";
import { isNylasConfigured } from "@/lib/nylas";
import { requireUserId } from "@/lib/require-user";
import { createServerFn } from "@tanstack/react-start";
import {
	EMAIL_ERROR,
	type EmailThreadDetailQuery,
	type EmailThreadsQuery,
	emailThreadDetailQuerySchema,
	emailThreadsQuerySchema,
} from "../types";
import * as service from "./service";

/** Resolves the signed-in user's primary mailbox grant, throwing the expected
 *  "not configured / not connected" errors the UI turns into a connect CTA.
 *  Centralizes the guard both read endpoints share. */
async function requireGrantId(): Promise<string> {
	const userId = await requireUserId();
	if (!isNylasConfigured()) {
		throw new AppError(
			EMAIL_ERROR.NOT_CONFIGURED,
			"Email isn't configured on this server yet.",
		);
	}
	const grantId = await getPrimaryGrantId(userId);
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
