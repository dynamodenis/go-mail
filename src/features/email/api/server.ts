import { createServerFn } from "@tanstack/react-start";
import { requireUserId } from "@/lib/require-user";
import { handleServerError, AppError } from "@/lib/errors";
import { isNylasConfigured } from "@/lib/nylas";
import { getPrimaryGrantId } from "@/features/settings/api/service";
import * as service from "./service";
import {
	EMAIL_ERROR,
	emailThreadsQuerySchema,
	emailThreadDetailQuerySchema,
	type EmailThreadsQuery,
	type EmailThreadDetailQuery,
} from "../types";

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
 * List threads for a folder (inbox / sent / drafts) on the user's primary
 * mailbox, optionally filtered by a search query.
 * @auth Required
 * @throws NYLAS_NOT_CONFIGURED, NYLAS_NOT_CONNECTED, EMAIL_FETCH_FAILED
 */
export const getEmailThreads = createServerFn({ method: "GET" })
	.inputValidator((data: EmailThreadsQuery) => emailThreadsQuerySchema.parse(data))
	.handler(async ({ data }) => {
		try {
			const grantId = await requireGrantId();
			return {
				data: await service.getThreads(grantId, data.folder, data.search),
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
