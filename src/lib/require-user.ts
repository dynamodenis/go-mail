import { getSupabaseServerClient } from "@/integrations/supabase/server";

/**
 * Authenticate the current user and return their Supabase ID.
 * Use in every server function that reads/writes user data.
 * @throws Error with code "UNAUTHORIZED" if no valid session
 */
export async function requireUserId(): Promise<string> {
	const supabase = getSupabaseServerClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		throw new Error("UNAUTHORIZED");
	}
	return user.id;
}
