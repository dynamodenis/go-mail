/** The consistent shape every server function returns (see CLAUDE.md "API
 *  Response Patterns"): `{ data }` on success, `{ error }` on failure. */
export type ServerResult<T> =
	| { data: T }
	| { error: { code: string; message: string } };

/** Error thrown on the CLIENT when a server function returns the `{ error }`
 *  envelope. Carries the server's `code` so global cache handlers can branch
 *  (e.g. redirect on `UNAUTHORIZED`) and `message` for display in a toast. */
export class ServerError extends Error {
	constructor(
		public readonly code: string,
		message: string,
	) {
		super(message);
		this.name = "ServerError";
	}
}

/** Unwrap a server result at the React Query boundary: return the data on
 *  success, or THROW a typed {@link ServerError} on the `{ error }` envelope so
 *  the failure lands in React Query's error state. This is what makes error
 *  handling uniform — every query/mutation failure (auth loss, validation,
 *  business rule, outage) flows through the same `QueryCache`/`MutationCache`
 *  `onError` handlers wired in `router.tsx`.
 *
 *  Use it in every `queryFn`/`mutationFn`:
 *    queryFn: async () => unwrap(await server.getThings({ data: filters }))
 */
export function unwrap<T>(result: ServerResult<T>): T {
	if (result && typeof result === "object" && "error" in result) {
		throw new ServerError(result.error.code, result.error.message);
	}
	return (result as { data: T }).data;
}
