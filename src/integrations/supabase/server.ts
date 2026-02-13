import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getCookies, setCookie } from "@tanstack/react-start/server";

export function getSupabaseServerClient() {
	const url = process.env.SUPABASE_URL;
	const key = process.env.SUPABASE_ANON_KEY;

	if (!url || !key) {
		throw new Error(
			"Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables. Check your .env file.",
		);
	}

	return createServerClient(url, key, {
		cookies: {
			async getAll() {
				return Object.entries(getCookies()).map(([name, value]) => ({
					name,
					value: value ?? "",
				}));
			},
			setAll(
				cookies: { name: string; value: string; options?: CookieOptions }[],
			) {
				for (const cookie of cookies) {
					setCookie(cookie.name, cookie.value, cookie.options);
				}
			},
		},
	});
}
