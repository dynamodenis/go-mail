/**
 * Nylas v3 hosted-authentication helpers.
 *
 * Intentionally SDK-free: the hosted OAuth flow is a redirect plus a single
 * token-exchange POST, so we call the REST endpoints with `fetch` and avoid
 * adding the `nylas` package as a dependency. Swap to the official SDK later if
 * you need messages/calendar reads — the connect flow won't change.
 *
 * Configure these in .env (see `isNylasConfigured`):
 *   NYLAS_CLIENT_ID     — your Nylas application's client id
 *   NYLAS_API_KEY       — your Nylas API key (used as the client secret in v3)
 *   NYLAS_API_URI       — region host, e.g. https://api.us.nylas.com (default)
 *   NYLAS_REDIRECT_URI  — must EXACTLY match a callback registered in Nylas,
 *                         e.g. https://app.example.com/api/nylas/callback
 */

const DEFAULT_API_URI = "https://api.us.nylas.com";

/** Name of the short-lived cookie holding the OAuth `state` CSRF token. Set when
 *  the flow starts, re-checked on the callback. Lives here so both the server
 *  function and the callback route share one source of truth. */
export const NYLAS_STATE_COOKIE = "nylas_oauth_state";

export const NYLAS_CLIENT_ID = process.env.NYLAS_CLIENT_ID ?? "";
export const NYLAS_API_KEY = process.env.NYLAS_API_KEY ?? "";
export const NYLAS_API_URI = process.env.NYLAS_API_URI ?? DEFAULT_API_URI;
export const NYLAS_REDIRECT_URI = process.env.NYLAS_REDIRECT_URI ?? "";

/** True only when every value the OAuth flow needs is present. The UI uses this
 *  to render a "not configured" state instead of a dead Connect button, per the
 *  Nylas feature-flag rule in CLAUDE.md. */
export function isNylasConfigured(): boolean {
	return Boolean(NYLAS_CLIENT_ID && NYLAS_API_KEY && NYLAS_REDIRECT_URI);
}

/** Builds the hosted-auth URL to redirect the user to. `state` is an opaque
 *  CSRF token the caller also stores in a short-lived cookie and re-checks on
 *  the callback. */
export function buildNylasAuthUrl(state: string): string {
	const params = new URLSearchParams({
		client_id: NYLAS_CLIENT_ID,
		redirect_uri: NYLAS_REDIRECT_URI,
		response_type: "code",
		access_type: "offline",
		state,
	});
	return `${NYLAS_API_URI}/v3/connect/auth?${params.toString()}`;
}

export interface NylasGrant {
	grantId: string;
	email: string;
}

/** Exchanges the `code` from the callback for a grant. In v3 the API key doubles
 *  as the client secret. Throws on a non-2xx response or a payload missing the
 *  grant id — callers map that to a user-facing error. */
export async function exchangeCodeForGrant(code: string): Promise<NylasGrant> {
	const res = await fetch(`${NYLAS_API_URI}/v3/connect/token`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			client_id: NYLAS_CLIENT_ID,
			client_secret: NYLAS_API_KEY,
			redirect_uri: NYLAS_REDIRECT_URI,
			code,
			grant_type: "authorization_code",
		}),
	});

	if (!res.ok) {
		// Don't surface Nylas's raw body (may include tokens) — log a status only.
		console.error("[Nylas] token exchange failed", res.status);
		throw new Error("NYLAS_EXCHANGE_FAILED");
	}

	const body = (await res.json()) as {
		grant_id?: string;
		email?: string;
	};

	if (!body.grant_id) {
		throw new Error("NYLAS_EXCHANGE_FAILED");
	}

	return { grantId: body.grant_id, email: body.email ?? "" };
}
