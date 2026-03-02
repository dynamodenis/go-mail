import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { CreateContactInput } from "@/features/contacts/schemas/types";

export async function saveContact(contact: CreateContactInput & { userId: string }) {
	const { userId, metadata, ...rest } = contact;
	return prisma.contact.create({
		data: {
			...rest,
			metadata: metadata as Prisma.InputJsonValue | undefined,
			user: {
				connect: { id: userId },
			},
		},
	});
}