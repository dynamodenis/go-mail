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
		} = await supabase.auth.getUser();
		if (!user) {
			throw new Error("UNAUTHORIZED");
		}
		return user.id;
	} catch (error) {
		if (
			error instanceof Error &&
			error.message === "UNAUTHORIZED"
		) {
			throw error;
		}
		if (isSupabaseUnavailableError(error)) {
			throw new Error("AUTH_SERVICE_UNAVAILABLE");
		}
		throw new Error("UNAUTHORIZED");
	}
}
