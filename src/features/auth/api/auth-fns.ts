import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "@/integrations/supabase/server";
import type { User } from "../schemas/auth";
import * as repository from "./repository";
/**
 * Fetches the current authenticated user with profile data from PostgreSQL.
 * Falls back to upserting the User row if it doesn't exist (legacy users).
 * @returns User object or null if not authenticated
 */
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
			// Try to get existing User row from PostgreSQL
			const dbUser = await repository.findUserById(user.id);
			if (dbUser) {
				// Backfill TipTap tokens for existing users who don't have them
				if (!dbUser.tiptapCollabJwt || !dbUser.tiptapAiJwt) {
					return repository.backfillTiptapTokens(user.id);
				}
				return dbUser;
			}

			// Safety net: upsert if the row doesn't exist (legacy Supabase user)
			return repository.upsertUser(user);
		} catch {
			return null;
		}
	},
);

/**
 * Signs in a user with email/password via Supabase and syncs
 * the PostgreSQL User row (creates if missing, updates lastLoginAt).
 * @throws Returns { error: string } on failure
 */
export const signInFn = createServerFn({ method: "POST" })
	.inputValidator((data: { email: string; password: string }) => data)
	.handler(async ({ data }) => {
		try {
			const supabase = getSupabaseServerClient();
			const { data: response, error } =
				await supabase.auth.signInWithPassword({
					email: data.email,
					password: data.password,
				});

			if (error) {
				return { error: error.message };
			}

			// Sync user to PostgreSQL (upsert)
			if (response.user) {
				await repository.upsertUser(response.user);
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

/**
 * Signs up a new user via Supabase and creates the PostgreSQL User row
 * with the provided fullName.
 * @throws Returns { error: string } on failure
 */
export const signUpFn = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { email: string; password: string; fullName?: string }) => data,
	)
	.handler(async ({ data }) => {
		try {
			const supabase = getSupabaseServerClient();
			const { data: response, error } = await supabase.auth.signUp({
				email: data.email,
				password: data.password,
				options: {
					data: {
						full_name: data.fullName || undefined,
					},
				},
			});

			if (error) {
				return { error: error.message };
			}

			// Create PostgreSQL User row if Supabase returned a user
			if (response.user) {
				await repository.createUser({
					id: response.user.id,
					email: response.user.email!,
					fullName: data.fullName,
				});
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

/**
 * Signs out the current user via Supabase.
 */
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
