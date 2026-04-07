import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchUser } from "./auth-fns";

/** Query key factory for auth queries */
export const authKeys = {
	user: ["auth", "user"] as const,
};

/** Query options for the current user — reusable in ensureQueryData and useQuery */
export const userQueryOptions = queryOptions({
	queryKey: authKeys.user,
	queryFn: () => fetchUser(),
	staleTime: 300_000, // 5 minutes — profile data rarely changes
	retry: (failureCount, error) => {
		// Don't retry when the auth service is completely unreachable
		// (e.g. Supabase paused, DNS failure) — it won't recover quickly
		if (
			error instanceof Error &&
			error.message === "AUTH_SERVICE_UNAVAILABLE"
		) {
			return failureCount < 1; // allow one retry, then stop
		}
		return failureCount < 3;
	},
	retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
});

/** Hook to get the current user from React Query cache */
export function useCurrentUserQuery() {
	return useQuery(userQueryOptions);
}
