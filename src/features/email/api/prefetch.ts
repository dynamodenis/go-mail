import type { QueryClient } from "@tanstack/react-query";
import type { EmailFolderItem, EmailThread, FolderRole } from "../types";
import {
	emailFoldersQueryOptions,
	emailThreadDetailQueryOptions,
	emailThreadsQueryOptions,
} from "./queries";

/** Warms the email cache so the inbox feels instant on first open. Client-side
 *  and non-blocking — `prefetchQuery` never throws, so a disconnected mailbox
 *  (server returns NYLAS_NOT_CONNECTED) just no-ops, no precheck needed. */

// Roles whose thread lists we warm so switching between them is instant.
const LIST_ROLES: ReadonlySet<FolderRole> = new Set([
	"inbox",
	"sent",
	"drafts",
]);

// Roles whose message bodies we additionally warm, and how many threads deep.
// Limited to the heavy-read folders (inbox + sent) to stay well under Nylas's
// per-grant rate limits — see best-practices: the threads endpoint is costly.
const DETAIL_WARM_ROLES: ReadonlySet<FolderRole> = new Set(["inbox", "sent"]);
const DETAIL_WARM_COUNT = 10;

export async function prefetchEmailData(
	queryClient: QueryClient,
): Promise<void> {
	// Wave 0 — the folder list. Both the sidebar and the thread-list prefetch
	// below need it, so await before reading folder ids.
	await queryClient.prefetchQuery(emailFoldersQueryOptions());
	const folders = queryClient.getQueryData<EmailFolderItem[]>(
		emailFoldersQueryOptions().queryKey,
	);
	if (!folders?.length) return; // not connected / not configured — nothing to warm

	// Wave 1 — thread lists for the everyday folders. Await so the warmed lists
	// are in the cache before we read thread ids for wave 2.
	const listFolders = folders.filter((f) => LIST_ROLES.has(f.role));
	await Promise.allSettled(
		listFolders.map((f) =>
			queryClient.prefetchQuery(emailThreadsQueryOptions(f.id, f.role)),
		),
	);

	// Wave 2 — warm message bodies for the top N threads of the heavy-read
	// folders. Fire-and-forget: opening any of these threads is then instant.
	for (const folder of folders.filter((f) => DETAIL_WARM_ROLES.has(f.role))) {
		const threads = queryClient.getQueryData<EmailThread[]>(
			emailThreadsQueryOptions(folder.id, folder.role).queryKey,
		);
		if (!threads) continue;

		for (const thread of threads.slice(0, DETAIL_WARM_COUNT)) {
			void queryClient.prefetchQuery(emailThreadDetailQueryOptions(thread.id));
		}
	}
}
