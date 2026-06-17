import type { QueryClient } from "@tanstack/react-query";
import type { EmailFolder, EmailThread } from "../types";
import {
	emailThreadDetailQueryOptions,
	emailThreadsQueryOptions,
} from "./queries";

/** Warms the email cache so the inbox feels instant on first open. Client-side
 *  and non-blocking — `prefetchQuery` never throws, so a disconnected mailbox
 *  (server returns NYLAS_NOT_CONNECTED) just no-ops, no precheck needed. */

// Folders whose thread lists we warm so switching between them is instant.
const LIST_FOLDERS: EmailFolder[] = ["inbox", "sent", "drafts"];

// Folders whose message bodies we additionally warm, and how many threads deep.
// Limited to the heavy-read folders (inbox + sent) to stay well under Nylas's
// per-grant rate limits — see best-practices: the threads endpoint is costly.
const DETAIL_WARM_FOLDERS: EmailFolder[] = ["inbox", "sent"];
const DETAIL_WARM_COUNT = 10;

export async function prefetchEmailData(queryClient: QueryClient): Promise<void> {
	// Wave 1 — thread lists for each folder. Await so the warmed lists are in the
	// cache before we read thread ids for wave 2.
	await Promise.allSettled(
		LIST_FOLDERS.map((folder) =>
			queryClient.prefetchQuery(emailThreadsQueryOptions(folder)),
		),
	);

	// Wave 2 — warm message bodies for the top N threads of the heavy-read
	// folders. Fire-and-forget: opening any of these threads is then instant.
	for (const folder of DETAIL_WARM_FOLDERS) {
		const threads = queryClient.getQueryData<EmailThread[]>(
			emailThreadsQueryOptions(folder).queryKey,
		);
		if (!threads) continue;

		for (const thread of threads.slice(0, DETAIL_WARM_COUNT)) {
			void queryClient.prefetchQuery(emailThreadDetailQueryOptions(thread.id));
		}
	}
}
