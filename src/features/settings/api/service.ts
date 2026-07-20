import { AppError } from "@/lib/errors";
import { exchangeCodeForGrant, isNylasConfigured } from "@/lib/nylas";
import type { NylasConnection } from "../types";
import * as repo from "./repository";

/** Business logic for the settings feature. No HTTP or Prisma concerns. */

/** Returns the current user's connected mailboxes plus whether the server is
 *  configured to offer connections at all. `configured: false` tells the UI to
 *  show a "set up Nylas" state rather than a dead Connect button. */
export async function getNylasConnection(
	userId: string,
): Promise<NylasConnection> {
	const accounts = await repo.listNylasAccounts(userId);
	return {
		configured: isNylasConfigured(),
		accounts: accounts.map((a) => ({
			id: a.id,
			email: a.email,
			isPrimary: a.isPrimary,
			createdAt: a.createdAt.toISOString(),
		})),
	};
}

/** The current user's primary mailbox grant id, or null if nothing is
 *  connected. Used by the email feature to make Nylas calls on the user's
 *  behalf. The grant stays server-side — never return it to the client. */
export async function getPrimaryGrantId(
	userId: string,
): Promise<string | null> {
	return repo.findPrimaryGrantId(userId);
}

/** Completes the OAuth callback: exchanges the code for a grant and persists it
 *  as one of the user's mailboxes. Reconnecting an existing address refreshes
 *  its grant; the first mailbox a user connects becomes primary.
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

	const existing = await repo.findNylasAccountByEmail(userId, grant.email);
	if (existing) {
		await repo.updateNylasAccountGrant(existing.id, grant.grantId);
	} else {
		// First mailbox a user connects becomes their primary by default.
		const isPrimary = (await repo.countNylasAccounts(userId)) === 0;
		await repo.createNylasAccount(userId, {
			grantId: grant.grantId,
			email: grant.email,
			isPrimary,
		});
	}

	return getNylasConnection(userId);
}

/** Disconnects one mailbox. If it was the primary and other mailboxes remain,
 *  the oldest survivor is promoted so the user always has a primary.
 *  @throws NYLAS_ACCOUNT_NOT_FOUND */
export async function disconnectNylas(
	userId: string,
	accountId: string,
): Promise<NylasConnection> {
	const account = await repo.findNylasAccount(userId, accountId);
	if (!account) {
		throw new AppError(
			"NYLAS_ACCOUNT_NOT_FOUND",
			"That email account is no longer connected.",
		);
	}

	await repo.deleteNylasAccount(userId, accountId);

	if (account.isPrimary) {
		const next = await repo.findOldestNylasAccount(userId);
		if (next) {
			await repo.setPrimaryNylasAccount(userId, next.id);
		}
	}

	return getNylasConnection(userId);
}

/** Marks a mailbox as the user's primary (default for inbox/sending).
 *  @throws NYLAS_ACCOUNT_NOT_FOUND */
export async function setPrimaryNylasAccount(
	userId: string,
	accountId: string,
): Promise<NylasConnection> {
	const account = await repo.findNylasAccount(userId, accountId);
	if (!account) {
		throw new AppError(
			"NYLAS_ACCOUNT_NOT_FOUND",
			"That email account is no longer connected.",
		);
	}

	await repo.setPrimaryNylasAccount(userId, accountId);
	return getNylasConnection(userId);
}

/** The grant id behind a specific connected account — null unless the account
 *  exists AND belongs to this user. This ownership check is what stops one
 *  user sending through another user's mailbox; like getPrimaryGrantId, the
 *  grant never leaves the server. */
export async function getGrantIdForAccount(
	userId: string,
	accountId: string,
): Promise<string | null> {
	return repo.findGrantIdByAccountId(userId, accountId);
}
