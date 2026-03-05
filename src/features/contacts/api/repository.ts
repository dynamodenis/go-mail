import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type {
	ContactFilters,
	CreateContactInput,
	ImportContactsInput,
	UpdateContactInput,
} from "@/features/contacts/schemas/types";

const CONTACT_SELECT = {
	id: true,
	email: true,
	firstName: true,
	lastName: true,
	phone: true,
	company: true,
	status: true,
	tags: true,
	createdAt: true,
	updatedAt: true,
} as const;

export async function saveContact(
	contact: CreateContactInput & { userId: string },
) {
	const { userId, metadata, ...rest } = contact;
	return prisma.contact.create({
		data: {
			...rest,
			metadata: metadata as Prisma.InputJsonValue | undefined,
			user: { connect: { id: userId } },
		},
		select: CONTACT_SELECT,
	});
}

export async function getContacts(userId: string, filters: ContactFilters) {
	const { search, status, collectionId, page, pageSize } = filters;

	const where: Prisma.ContactWhereInput = {
		userId,
		...(status && { status }),
		...(collectionId && {
			collections: { some: { collectionId } },
		}),
		...(search && {
			OR: [
				{ email: { contains: search, mode: "insensitive" as const } },
				{ firstName: { contains: search, mode: "insensitive" as const } },
				{ lastName: { contains: search, mode: "insensitive" as const } },
				{ company: { contains: search, mode: "insensitive" as const } },
			],
		}),
	};

	const [data, total] = await Promise.all([
		prisma.contact.findMany({
			where,
			select: CONTACT_SELECT,
			orderBy: { createdAt: "desc" },
			skip: (page - 1) * pageSize,
			take: pageSize,
		}),
		prisma.contact.count({ where }),
	]);

	return { data, total, page, pageSize };
}

export async function getContactById(userId: string, contactId: string) {
	return prisma.contact.findFirst({
		where: { id: contactId, userId },
		select: CONTACT_SELECT,
	});
}

export async function updateContact(
	userId: string,
	input: UpdateContactInput,
) {
	const { id, ...data } = input;
	return prisma.contact.update({
		where: { id, userId },
		data,
		select: CONTACT_SELECT,
	});
}

export async function deleteContact(userId: string, contactId: string) {
	return prisma.contact.delete({
		where: { id: contactId, userId },
	});
}

export async function deleteContacts(userId: string, contactIds: string[]) {
	return prisma.contact.deleteMany({
		where: { id: { in: contactIds }, userId },
	});
}

/** Bulk-imports contacts in a transaction, optionally linking them to a collection.
 *  Uses skipDuplicates to silently ignore contacts with existing emails. */
export async function importContacts(
	userId: string,
	input: ImportContactsInput,
) {
	return prisma.$transaction(async (tx) => {
		const contactData = input.contacts.map((c) => ({
			userId,
			email: c.email,
			firstName: c.firstName ?? null,
			lastName: c.lastName ?? null,
			phone: c.phone ?? null,
			company: c.company ?? null,
			status: c.status ?? "ACTIVE",
			source: "CSV_IMPORT" as const,
		}));

		const result = await tx.contact.createMany({
			data: contactData,
			skipDuplicates: true,
		});

		if (input.collectionId) {
			const emails = input.contacts.map((c) => c.email);
			const createdContacts = await tx.contact.findMany({
				where: { userId, email: { in: emails } },
				select: { id: true },
			});

			const collectionContactData = createdContacts.map((c) => ({
				collectionId: input.collectionId!,
				contactId: c.id,
			}));

			await tx.collectionContact.createMany({
				data: collectionContactData,
				skipDuplicates: true,
			});
		}

		return { importedCount: result.count };
	});
}
