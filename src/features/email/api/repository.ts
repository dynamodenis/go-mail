import { nylas } from "@/lib/nylas";
import type { Message, Thread } from "nylas";
import { FOLDER_ATTRIBUTE, type EmailFolder } from "../types";

/** Pure data-access layer for email — every call goes through the central Nylas
 *  client scoped to a grant id. No auth, no business rules, no mapping; returns
 *  raw Nylas models for the service to shape. */

// Threads call many provider APIs per request, so always bound with a limit
// (Nylas best-practices). 25 matches the app-wide default page size.
const THREAD_PAGE_SIZE = 25;

/** Resolves the provider's folder id for one of our UI folders by matching the
 *  IMAP special-use attribute, falling back to a name match. Returns null when
 *  the mailbox has no such folder. */
export async function resolveFolderId(
	grantId: string,
	folder: EmailFolder,
): Promise<string | null> {
	const attribute = FOLDER_ATTRIBUTE[folder];
	const { data } = await nylas.folders.list({ identifier: grantId });

	const byAttribute = data.find((f) => f.attributes?.includes(attribute));
	if (byAttribute) return byAttribute.id;

	const byName = data.find((f) => f.name?.toLowerCase() === folder);
	return byName?.id ?? null;
}

/** Lists threads in a folder, optionally filtered by a provider-native search
 *  query. Bounded by THREAD_PAGE_SIZE. */
export async function listThreads(
	grantId: string,
	folderId: string,
	search?: string,
): Promise<Thread[]> {
	const { data } = await nylas.threads.list({
		identifier: grantId,
		queryParams: {
			in: [folderId],
			limit: THREAD_PAGE_SIZE,
			...(search ? { searchQueryNative: search } : {}),
		},
	});
	return data;
}

/** Fetches a single thread's metadata. */
export async function findThread(
	grantId: string,
	threadId: string,
): Promise<Thread> {
	const { data } = await nylas.threads.find({ identifier: grantId, threadId });
	return data;
}

/** Fetches every message in a thread for the reading pane. */
export async function listThreadMessages(
	grantId: string,
	threadId: string,
): Promise<Message[]> {
	const { data } = await nylas.messages.list({
		identifier: grantId,
		queryParams: { threadId },
	});
	return data;
}
