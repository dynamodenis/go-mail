import * as repo from "@/features/contacts/api/repository";
import type { CreateContactInput } from "@/features/contacts/schemas/types";
import { AppError } from "@/lib/errors";
import { Prisma } from "@prisma/client";

export async function saveContactService(
	contact: CreateContactInput & { userId: string },
) {
	try {
		return await repo.saveContact(contact);
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2002"
		) {
			throw new AppError(
				"CONTACT_ALREADY_EXISTS",
				"A contact with this email already exists.",
			);
		}
		throw error;
	}
}
