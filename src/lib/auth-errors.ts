/**
 * Checks whether an error indicates that Supabase is unreachable
 * (paused project, DNS failure, network timeout, etc.).
 */
export function isSupabaseUnavailableError(error: unknown): boolean {
	if (!error || typeof error !== "object") return false;

	// Supabase auth library tags retryable fetch errors
	if ("__isAuthError" in error && "status" in error) {
		const authErr = error as { __isAuthError: boolean; status: number };
		if (authErr.__isAuthError && authErr.status === 0) return true;
	}

	const message =
		error instanceof Error ? error.message : String(error);

	return (
		message.includes("fetch failed") ||
		message.includes("ENOTFOUND") ||
		message.includes("ECONNREFUSED") ||
		message.includes("ETIMEDOUT") ||
		message.includes("ECONNRESET") ||
		message.includes("AuthRetryableFetchError")
	);
}
