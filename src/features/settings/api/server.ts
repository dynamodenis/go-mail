import { createServerFn } from "@tanstack/react-start";
import { setCookie } from "@tanstack/react-start/server";
import { requireUserId } from "@/lib/require-user";
import { handleServerError, AppError } from "@/lib/errors";
import {
	buildNylasAuthUrl,
	isNylasConfigured,
	NYLAS_STATE_COOKIE,
} from "@/lib/nylas";
import * as service from "./service";
import { nylasAccountIdSchema, type NylasAccountIdInput } from "../types";

/**
 * Get the current user's Nylas connection status.
 * @auth Required
 */
export const getNylasConnection = createServerFn({ method: "GET" }).handler(
	async () => {
		try {
			const userId = await requireUserId();
			return { data: await service.getNylasConnection(userId) };
		} catch (error) {
			return handleServerError(error);
		}
	},
);

/**
 * Begin the Nylas hosted-auth flow. Mints a CSRF `state`, stores it in an
 * httpOnly cookie, and returns the hosted-auth URL for the client to redirect
 * to. The grant is stored later by the callback route.
 * @auth Required
 * @throws NYLAS_NOT_CONFIGURED
 */
export const startNylasConnect = createServerFn({ method: "POST" }).handler(
	async () => {
		try {
			await requireUserId();
			if (!isNylasConfigured()) {
				throw new AppError(
					"NYLAS_NOT_CONFIGURED",
					"Nylas is not configured on this server.",
				);
			}

			const state = crypto.randomUUID();
			setCookie(NYLAS_STATE_COOKIE, state, {
				httpOnly: true,
				sameSite: "lax",
				secure: process.env.NODE_ENV === "production",
				path: "/",
				maxAge: 600, // 10 minutes — the user has to finish OAuth in that window.
			});

			return { data: { url: buildNylasAuthUrl(state) } };
		} catch (error) {
			return handleServerError(error);
		}
	},
);

/**
 * Disconnect a single connected mailbox for the current user.
 * @auth Required
 * @throws NYLAS_ACCOUNT_NOT_FOUND
 */
export const disconnectNylas = createServerFn({ method: "POST" })
	.inputValidator((data: NylasAccountIdInput) => nylasAccountIdSchema.parse(data))
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			return { data: await service.disconnectNylas(userId, data.accountId) };
		} catch (error) {
			return handleServerError(error);
		}
	});

/**
 * Make one of the user's connected mailboxes their primary (default).
 * @auth Required
 * @throws NYLAS_ACCOUNT_NOT_FOUND
 */
export const setPrimaryNylasAccount = createServerFn({ method: "POST" })
	.inputValidator((data: NylasAccountIdInput) => nylasAccountIdSchema.parse(data))
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			return {
				data: await service.setPrimaryNylasAccount(userId, data.accountId),
			};
		} catch (error) {
			return handleServerError(error);
		}
	});
