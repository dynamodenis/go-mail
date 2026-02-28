import { prisma } from "@/lib/prisma";

const USER_SELECT = {
	id: true,
	email: true,
	fullName: true,
	avatarUrl: true,
	companyName: true,
	plan: true,
	role: true,
	onboardingCompleted: true,
} as const;

/** Find a User row by Supabase ID. Returns null if not found. */
export async function findUserById(id: string) {
	return prisma.user.findUnique({
		where: { id },
		select: USER_SELECT,
	});
}

/** Upsert a User row — creates if missing, updates lastLoginAt if exists. */
export async function upsertUser(supabaseUser: {
	id: string;
	email?: string;
	user_metadata?: Record<string, unknown>;
}) {
	return prisma.user.upsert({
		where: { id: supabaseUser.id },
		update: { lastLoginAt: new Date() },
		create: {
			id: supabaseUser.id,
			email: supabaseUser.email!,
			fullName:
				(supabaseUser.user_metadata?.full_name as string) ?? null,
		},
		select: USER_SELECT,
	});
}

/** Create a new User row after signup. */
export async function createUser(data: {
	id: string;
	email: string;
	fullName?: string | null;
}) {
	return prisma.user.create({
		data: {
			id: data.id,
			email: data.email,
			fullName: data.fullName ?? null,
		},
		select: USER_SELECT,
	});
}
