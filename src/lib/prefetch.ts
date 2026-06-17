import type { QueryClient } from "@tanstack/react-query";
import { prefetchEmailData } from "@/features/email/api/prefetch";

/** A feature prefetcher: warms one feature's React Query cache for the signed-in
 *  user. May be async or sync (return value is ignored); must not throw (use
 *  prefetchQuery, which swallows errors) — failures are isolated by
 *  `Promise.allSettled` below regardless. */
export type Prefetcher = (queryClient: QueryClient) => unknown;

/** Registered feature prefetchers, warmed when an authenticated user lands.
 *  Add new ones here — each runs independently, so one failing never blocks the
 *  others or the page. */
const PREFETCHERS: Prefetcher[] = [prefetchEmailData];

/** Warms every registered feature cache in parallel. Safe to call repeatedly —
 *  already-fresh queries are no-ops thanks to each query's staleTime. */
export function prefetchAllData(queryClient: QueryClient) {
	return Promise.allSettled(
		PREFETCHERS.map((prefetch) => Promise.resolve(prefetch(queryClient))),
	);
}
