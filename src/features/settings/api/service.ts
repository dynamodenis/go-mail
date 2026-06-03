import { AppError } from "@/lib/errors";
import {
	exchangeCodeForGrant,
	isNylasConfigured,
} from "@/lib/nylas";
import * as repo from "./repository";
import type { NylasConnection } from "../types";

/** Business logic for the settings feature. No HTTP or Prisma concerns. */

/** Reports whether the current user has a connected Nylas grant, and whether the
 *  server is even configured to offer the connection. `configured: false` tells
 *  the UI to show a "set up Nylas" state rather than a dead Connect button. */
export async function getNylasConnection(
	userId: string,
): Promise<NylasConnection> {
	const settings = await repo.findNylasSettings(userId);
	return {
		configured: isNylasConfigured(),
		connected: Boolean(settings?.nylasGrantId),
		email: settings?.nylasEmail ?? null,
	};
}

/** Completes the OAuth callback: exchanges the code for a grant and persists it.
 *  Throws NYLAS_NOT_CONFIGURED if env is missing, or NYLAS_CONNECT_FAILED if the
 *  exchange fails — the callback route maps both to an error redirect.
 *  @throws NYLAS_NOT_CONFIGURED, NYLAS_CONNECT_FAILED */
export async function connectNylas(
	userId: string,
	code: string,
): Promise<NylasConnection> {
	if (!isNylasConfigured()) {
		throw new AppError(
			"NYLAS_NOT_CONFIGURED",
			"Nylas is not configured on this server.",
		);
	}

	let grant: { grantId: string; email: string };
	try {
		grant = await exchangeCodeForGrant(code);
	} catch {
		throw new AppError(
			"NYLAS_CONNECT_FAILED",
			"Could not complete the Nylas connection. Please try again.",
		);
	}

	await repo.upsertNylasGrant(userId, grant);
	return { configured: true, connected: true, email: grant.email };
}

/** Removes the stored grant so the account is no longer connected. Idempotent —
 *  disconnecting an already-disconnected account is a no-op. */
export async function disconnectNylas(
	userId: string,
): Promise<NylasConnection> {
	await repo.clearNylasGrant(userId);
	return {
		configured: isNylasConfigured(),
		connected: false,
		email: null,
	};
}
