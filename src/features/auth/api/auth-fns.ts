import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "@/integrations/supabase/server";
import type { User } from "../schemas/auth";

export const fetchUser = createServerFn({ method: "GET" }).handler(
	async (): Promise<User | null> => {
		try {
			const supabase = getSupabaseServerClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) {
				return null;
			}

			return {
				id: user.id,
				email: user.email!,
			};
		} catch {
			return null;
		}
	},
);

export const signInFn = createServerFn({ method: "POST" })
	.inputValidator((data: { email: string; password: string }) => data)
	.handler(async ({ data }) => {
		try {
			const supabase = getSupabaseServerClient();
			const { data: response, error } = await supabase.auth.signInWithPassword({
				email: data.email,
				password: data.password,
			});
			console.log("response from signInWithPassword", response);

			if (error) {
				return { error: error.message };
			}

			return { success: true as const };
		} catch (e) {
			return {
				error:
					e instanceof Error && e.message.includes("Missing SUPABASE")
						? e.message
						: "Unable to connect to the authentication service. Please try again.",
			};
		}
	});

export const signUpFn = createServerFn({ method: "POST" })
	.inputValidator((data: { email: string; password: string }) => data)
	.handler(async ({ data }) => {
		try {
			const supabase = getSupabaseServerClient();
			const { error } = await supabase.auth.signUp({
				email: data.email,
				password: data.password,
			});

			if (error) {
				return { error: error.message };
			}

			return {
				success:
					"Account created! Please check your email for a confirmation link.",
			};
		} catch (e) {
			return {
				error:
					e instanceof Error && e.message.includes("Missing SUPABASE")
						? e.message
						: "Unable to connect to the authentication service. Please try again.",
			};
		}
	});

export const signOutFn = createServerFn({ method: "POST" }).handler(
	async () => {
		try {
			const supabase = getSupabaseServerClient();
			await supabase.auth.signOut();
		} catch {
			// Sign out locally even if the server call fails
		}

		return { success: true as const };
	},
);
