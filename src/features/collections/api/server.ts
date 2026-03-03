import { createServerFn } from "@tanstack/react-start";
import {
	createCollectionService,
	getCollectionsService,
	updateCollectionService,
	deleteCollectionService,
	deleteCollectionsService,
} from "@/features/collections/api/service";
import { requireUserId } from "@/lib/require-user";
import { handleServerError } from "@/lib/errors";
import type {
	CreateCollectionInput,
	CollectionFilters,
	UpdateCollectionInput,
} from "@/features/collections/schemas/types";
import {
	createCollectionSchema,
	collectionFiltersSchema,
	updateCollectionSchema,
	deleteCollectionSchema,
	deleteCollectionsSchema,
} from "@/features/collections/schemas/types";

/** Creates a new collection for the authenticated user.
 *  Auth: Requires authenticated session.
 *  Errors: INTERNAL_ERROR */
export const createCollection = createServerFn({ method: "POST" })
	.inputValidator(
		(data: CreateCollectionInput) => createCollectionSchema.parse(data),
	)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			const collection = await createCollectionService(userId, data);
			return { data: collection };
		} catch (error) {
			return handleServerError(error);
		}
	});

/** Fetches paginated collections with optional search filter.
 *  Auth: Requires authenticated session.
 *  Errors: INTERNAL_ERROR */
export const getCollections = createServerFn({ method: "GET" })
	.inputValidator(
		(data: CollectionFilters) => collectionFiltersSchema.parse(data),
	)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			const result = await getCollectionsService(userId, data);
			return { data: result };
		} catch (error) {
			return handleServerError(error);
		}
	});

/** Updates an existing collection.
 *  Auth: Requires authenticated session.
 *  Errors: COLLECTION_NOT_FOUND, INTERNAL_ERROR */
export const updateCollection = createServerFn({ method: "POST" })
	.inputValidator(
		(data: UpdateCollectionInput) => updateCollectionSchema.parse(data),
	)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			const collection = await updateCollectionService(userId, data);
			return { data: collection };
		} catch (error) {
			return handleServerError(error);
		}
	});

/** Deletes a single collection.
 *  Auth: Requires authenticated session.
 *  Errors: COLLECTION_NOT_FOUND, INTERNAL_ERROR */
export const deleteCollection = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { id: string }) => deleteCollectionSchema.parse(data),
	)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			await deleteCollectionService(userId, data.id);
			return { data: { success: true } };
		} catch (error) {
			return handleServerError(error);
		}
	});

/** Deletes multiple collections at once.
 *  Auth: Requires authenticated session.
 *  Errors: INTERNAL_ERROR */
export const deleteCollections = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { ids: string[] }) => deleteCollectionsSchema.parse(data),
	)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			const result = await deleteCollectionsService(userId, data.ids);
			return { data: result };
		} catch (error) {
			return handleServerError(error);
		}
	});
