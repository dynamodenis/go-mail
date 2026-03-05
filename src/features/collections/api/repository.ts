import { prisma } from "@/lib/prisma";
import type {
	CollectionFilters,
	CreateCollectionInput,
	UpdateCollectionInput,
	AddContactsToCollectionsInput,
	RemoveContactsFromCollectionInput,
} from "@/features/collections/schemas/types";

const COLLECTION_SELECT = {
	id: true,
	name: true,
	description: true,
	color: true,
	createdAt: true,
	updatedAt: true,
	_count: { select: { contacts: true } },
} as const;

type CollectionRow = {
	id: string;
	name: string;
	description: string;
	color: string;
	createdAt: Date;
	updatedAt: Date;
	_count: { contacts: number };
};

function toCollection(row: CollectionRow) {
	const { _count, ...rest } = row;
	return { ...rest, contactCount: _count.contacts };
}

export async function createCollection(
	userId: string,
	input: CreateCollectionInput,
) {
	const { contactIds, ...rest } = input;

	const row = await prisma.collection.create({
		data: {
			...rest,
			user: { connect: { id: userId } },
			...(contactIds?.length && {
				contacts: {
					create: contactIds.map((contactId) => ({
						contact: { connect: { id: contactId } },
					})),
				},
			}),
		},
		select: COLLECTION_SELECT,
	});
	return toCollection(row);
}

export async function getCollections(
	userId: string,
	filters: CollectionFilters,
) {
	const { search, page, pageSize } = filters;

	const where = {
		userId,
		...(search && {
			OR: [
				{ name: { contains: search, mode: "insensitive" as const } },
				{ description: { contains: search, mode: "insensitive" as const } },
			],
		}),
	};

	const [rows, total] = await Promise.all([
		prisma.collection.findMany({
			where,
			select: COLLECTION_SELECT,
			orderBy: { createdAt: "desc" },
			skip: (page - 1) * pageSize,
			take: pageSize,
		}),
		prisma.collection.count({ where }),
	]);

	return { data: rows.map(toCollection), total, page, pageSize };
}

export async function updateCollection(
	userId: string,
	input: UpdateCollectionInput,
) {
	const { id, description, contactIds, ...rest } = input;

	if (contactIds !== undefined) {
		const [, row] = await prisma.$transaction([
			prisma.collectionContact.deleteMany({ where: { collectionId: id } }),
			prisma.collection.update({
				where: { id, userId },
				data: {
					...rest,
					...(description !== undefined && {
						description: description ?? "",
					}),
					contacts: {
						create: contactIds.map((contactId) => ({
							contact: { connect: { id: contactId } },
						})),
					},
				},
				select: COLLECTION_SELECT,
			}),
		]);
		return toCollection(row);
	}

	const row = await prisma.collection.update({
		where: { id, userId },
		data: {
			...rest,
			...(description !== undefined && {
				description: description ?? "",
			}),
		},
		select: COLLECTION_SELECT,
	});
	return toCollection(row);
}

export async function getCollectionContactIds(
	userId: string,
	collectionId: string,
) {
	const rows = await prisma.collectionContact.findMany({
		where: {
			collectionId,
			collection: { userId },
		},
		select: { contactId: true },
	});
	return rows.map((r) => r.contactId);
}

export async function addContactsToCollections(
	userId: string,
	input: AddContactsToCollectionsInput,
) {
	const { contactIds, collectionIds } = input;

	const ownedCollections = await prisma.collection.findMany({
		where: { id: { in: collectionIds }, userId },
		select: { id: true },
	});
	const ownedIds = ownedCollections.map((c) => c.id);

	const data = ownedIds.flatMap((collectionId) =>
		contactIds.map((contactId) => ({ collectionId, contactId })),
	);

	const result = await prisma.collectionContact.createMany({
		data,
		skipDuplicates: true,
	});

	return { addedCount: result.count };
}

export async function getCollectionById(userId: string, collectionId: string) {
	const row = await prisma.collection.findFirst({
		where: { id: collectionId, userId },
		select: COLLECTION_SELECT,
	});
	if (!row) return null;
	return toCollection(row);
}

export async function removeContactsFromCollection(
	userId: string,
	input: RemoveContactsFromCollectionInput,
) {
	const result = await prisma.collectionContact.deleteMany({
		where: {
			collectionId: input.collectionId,
			contactId: { in: input.contactIds },
			collection: { userId },
		},
	});
	return { removedCount: result.count };
}

export async function deleteCollection(userId: string, collectionId: string) {
	return prisma.collection.delete({
		where: { id: collectionId, userId },
	});
}

export async function deleteCollections(
	userId: string,
	collectionIds: string[],
) {
	return prisma.collection.deleteMany({
		where: { id: { in: collectionIds }, userId },
	});
}
