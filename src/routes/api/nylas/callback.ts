import { createFileRoute } from "@tanstack/react-router";
import { getCookies, setCookie } from "@tanstack/react-start/server";
import { requireUserId } from "@/lib/require-user";
import { NYLAS_STATE_COOKIE } from "@/lib/nylas";
import * as service from "@/features/settings/api/service";
import { nylasCallbackSchema } from "@/features/settings/types";

// Where the user lands after the flow, with a status the UI reads off the query.
const SETTINGS_PATH = "/settings/integrations";

function redirect(status: "connected" | "error", reason?: string) {
	const params = new URLSearchParams({ nylas: status });
	if (reason) params.set("reason", reason);
	// Clear the one-time CSRF cookie regardless of outcome.
	setCookie(NYLAS_STATE_COOKIE, "", { path: "/", maxAge: 0 });
	return new Response(null, {
		status: 302,
		headers: { Location: `${SETTINGS_PATH}?${params.toString()}` },
	});
}

/**
 * Nylas hosted-auth callback. Verifies the CSRF `state`, exchanges the `code`
 * for a grant, stores it against the signed-in user, then redirects back to
 * Settings > Integrations with a status flag. Never exposes raw errors.
 */
export const Route = createFileRoute("/api/nylas/callback")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);

				// Nylas appends `error`/`error_description` when the user declines.
				if (url.searchParams.get("error")) {
					return redirect("error", "declined");
				}

				const parsed = nylasCallbackSchema.safeParse({
					code: url.searchParams.get("code"),
					state: url.searchParams.get("state"),
				});
				if (!parsed.success) {
					return redirect("error", "invalid_request");
				}

				// CSRF: the returned state must match the cookie we set at start.
				const cookieState = getCookies()[NYLAS_STATE_COOKIE];
				if (!cookieState || cookieState !== parsed.data.state) {
					return redirect("error", "state_mismatch");
				}

				try {
					const userId = await requireUserId();
					await service.connectNylas(userId, parsed.data.code);
					return redirect("connected");
				} catch {
					return redirect("error", "exchange_failed");
				}
			},
		},
	},
});
