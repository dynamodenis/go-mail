import { getSupabaseServerClient } from "@/integrations/supabase/server";
import { isSupabaseUnavailableError } from "@/lib/auth-errors";

/**
 * Authenticate the current user and return their Supabase ID.
 * Use in every server function that reads/writes user data.
 * @throws Error with code "UNAUTHORIZED" if no valid session
 * @throws Error with code "AUTH_SERVICE_UNAVAILABLE" if Supabase is unreachable
 */
export async function requireUserId(): Promise<string> {
	try {
		const supabase = getSupabaseServerClient();
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser();
		// getUser() does NOT throw on network failure — it returns the error in
		// the `error` field with user=null. Inspect it first so a Supabase
		// outage surfaces as AUTH_SERVICE_UNAVAILABLE instead of being
		// mislabelled as "logged out" (UNAUTHORIZED).
		if (error && isSupabaseUnavailableError(error)) {
			throw new Error("AUTH_SERVICE_UNAVAILABLE");
		}
		if (!user) {
			throw new Error("UNAUTHORIZED");
		}
		return user.id;
	} catch (error) {
		// Pass through the codes we throw deliberately above.
		if (
			error instanceof Error &&
			(error.message === "UNAUTHORIZED" ||
				error.message === "AUTH_SERVICE_UNAVAILABLE")
		) {
			throw error;
		}
		// getUser() can also reject (rather than return an error) on some
		// network failures — treat those as service-unavailable too.
		if (isSupabaseUnavailableError(error)) {
			throw new Error("AUTH_SERVICE_UNAVAILABLE");
		}
		throw new Error("UNAUTHORIZED");
	}
}
