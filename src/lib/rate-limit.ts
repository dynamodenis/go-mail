/** Minimal in-memory sliding-window rate limiter for write server functions
 *  (CLAUDE.md security rule). Per-process state: fine for a single Node
 *  server, swap for Redis if the app ever scales horizontally. */

const buckets = new Map<string, number[]>();

/** Records a hit for `key` and reports whether it stays within `limit` hits
 *  per `windowMs`. Over-limit hits are not recorded, so a client hammering the
 *  endpoint doesn't extend its own lockout. */
export function checkRateLimit(
	key: string,
	limit: number,
	windowMs: number,
): boolean {
	const cutoff = Date.now() - windowMs;
	const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);
	if (hits.length >= limit) {
		buckets.set(key, hits);
		return false;
	}
	hits.push(Date.now());
	buckets.set(key, hits);
	return true;
}
