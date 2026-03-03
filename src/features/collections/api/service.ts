import * as repo from "@/features/collections/api/repository";
import type {
	CollectionFilters,
	CreateCollectionInput,
	UpdateCollectionInput,
} from "@/features/collections/schemas/types";
import { AppError } from "@/lib/errors";
import { Prisma } from "@prisma/client";

export async function createCollectionService(
	userId: string,
	input: CreateCollectionInput,
) {
	return repo.createCollection(userId, input);
}

export async function getCollectionsService(
	userId: string,
	filters: CollectionFilters,
) {
	return repo.getCollections(userId, filters);
}

export async function updateCollectionService(
	userId: string,
	input: UpdateCollectionInput,
) {
	try {
		return await repo.updateCollection(userId, input);
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2025"
		) {
			throw new AppError("COLLECTION_NOT_FOUND", "Collection not found.");
		}
		throw error;
	}
}

export async function deleteCollectionService(
	userId: string,
	collectionId: string,
) {
	try {
		return await repo.deleteCollection(userId, collectionId);
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2025"
		) {
			throw new AppError("COLLECTION_NOT_FOUND", "Collection not found.");
		}
		throw error;
	}
}

export async function deleteCollectionsService(
	userId: string,
	collectionIds: string[],
) {
	const result = await repo.deleteCollections(userId, collectionIds);
	return { deletedCount: result.count };
}
