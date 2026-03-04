import * as repo from "@/features/contacts/api/repository";
import type {
	ContactFilters,
	CreateContactInput,
	ImportContactsInput,
	UpdateContactInput,
} from "@/features/contacts/schemas/types";
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

export async function getContactsService(
	userId: string,
	filters: ContactFilters,
) {
	return repo.getContacts(userId, filters);
}

export async function updateContactService(
	userId: string,
	input: UpdateContactInput,
) {
	try {
		return await repo.updateContact(userId, input);
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2025"
		) {
			throw new AppError("CONTACT_NOT_FOUND", "Contact not found.");
		}
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

export async function deleteContactService(
	userId: string,
	contactId: string,
) {
	try {
		return await repo.deleteContact(userId, contactId);
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2025"
		) {
			throw new AppError("CONTACT_NOT_FOUND", "Contact not found.");
		}
		throw error;
	}
}

export async function deleteContactsService(
	userId: string,
	contactIds: string[],
) {
	const result = await repo.deleteContacts(userId, contactIds);
	return { deletedCount: result.count };
}

/** Imports contacts in bulk, optionally assigning them to a collection.
 *  Validates collection ownership if collectionId is provided. */
export async function importContactsService(
	userId: string,
	input: ImportContactsInput,
) {
	if (input.collectionId) {
		const { prisma } = await import("@/lib/prisma");
		const collection = await prisma.collection.findFirst({
			where: { id: input.collectionId, userId },
			select: { id: true },
		});
		if (!collection) {
			throw new AppError("COLLECTION_NOT_FOUND", "Collection not found.");
		}
	}
	return repo.importContacts(userId, input);
}
