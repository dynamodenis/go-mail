import { prisma } from "@/lib/prisma";
import type {
	CollectionFilters,
	CreateCollectionInput,
	UpdateCollectionInput,
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
	const row = await prisma.collection.create({
		data: { ...input, user: { connect: { id: userId } } },
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
	const { id, description, ...rest } = input;
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
