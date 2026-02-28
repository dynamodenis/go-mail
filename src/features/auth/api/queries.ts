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
});

/** Hook to get the current user from React Query cache */
export function useCurrentUserQuery() {
	return useQuery(userQueryOptions);
}
