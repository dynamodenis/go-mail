import { useCurrentUserQuery } from "@/features/auth/api/queries";
import type { User } from "@/features/auth/schemas/auth";

/**
 * Returns the current authenticated user from React Query cache.
 * Data is already loaded by __root.tsx beforeLoad via ensureQueryData,
 * so this will always return synchronously from cache on authenticated routes.
 */
export function useCurrentUser(): User | null {
	const { data } = useCurrentUserQuery();
	return data ?? null;
}
