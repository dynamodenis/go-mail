import {
	MutationCache,
	QueryCache,
	QueryClient,
} from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { toast } from "@/components/ui/sooner";
import { ServerError } from "@/lib/server-result";
import { routeTree } from "./routeTree.gen";

/** Extract a stable error code from anything thrown through React Query.
 *  `ServerError` (from `unwrap`) carries the server code directly; we also match
 *  a raw "UNAUTHORIZED" message for server fns that still throw. */
function errorCode(error: unknown): string {
	if (error instanceof ServerError) return error.code;
	if (error instanceof Error && error.message.includes("UNAUTHORIZED")) {
		return "UNAUTHORIZED";
	}
	return "";
}

export function getRouter() {
	// Assigned just below; the cache error handlers close over it and only fire
	// at runtime (well after assignment), so the forward reference is safe.
	let router: ReturnType<typeof createRouter>;

	// Auth loss → bounce to sign-in. ONLY for genuine UNAUTHORIZED — NOT
	// AUTH_SERVICE_UNAVAILABLE, since an outage isn't a login problem and the
	// sign-in page can't reach Supabase either. Client-only: SSR redirects are
	// handled by route `beforeLoad` guards. Returns true if it redirected.
	const redirectOnAuthLoss = (error: unknown): boolean => {
		if (typeof window === "undefined") return false;
		if (errorCode(error) === "UNAUTHORIZED") {
			router?.navigate({ to: "/sign-in" });
			return true;
		}
		return false;
	};

	const queryClient = new QueryClient({
		// Queries: redirect on auth loss only. No toast — failed queries render
		// inline error states (background refetch failures shouldn't pop toasts).
		queryCache: new QueryCache({ onError: redirectOnAuthLoss }),
		// Mutations are explicit user actions, so surface failures as a toast.
		// Copy precedence: a mutation's `meta.errorMessage` override (for
		// operation-specific wording) → the server-provided message → a generic
		// fallback. This is the single place mutation errors are toasted, so
		// components must NOT add their own onError toast (that double-fires).
		mutationCache: new MutationCache({
			onError: (error, _vars, _ctx, mutation) => {
				if (redirectOnAuthLoss(error)) return; // session gone; don't toast
				if (typeof window === "undefined") return;
				const override = mutation.meta?.errorMessage;
				const message =
					(typeof override === "string" && override) ||
					(error instanceof Error && error.message) ||
					"Something went wrong. Please try again.";
				toast.error(message);
			},
		}),
	});

	router = createRouter({
		routeTree,
		defaultPreload: "intent",
		scrollRestoration: true,
		context: {
			queryClient,
			user: null,
		},
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
