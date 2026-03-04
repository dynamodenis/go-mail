import { z } from "zod";
import { fallback } from "@tanstack/zod-adapter";

export const COLLECTION_COLORS = [
	{ name: "Blue", value: "#3B82F6" },
	{ name: "Red", value: "#EF4444" },
	{ name: "Orange", value: "#F97316" },
	{ name: "Amber", value: "#F59E0B" },
	{ name: "Green", value: "#22C55E" },
	{ name: "Teal", value: "#14B8A6" },
	{ name: "Indigo", value: "#6366F1" },
	{ name: "Purple", value: "#A855F7" },
	{ name: "Pink", value: "#EC4899" },
	{ name: "Gray", value: "#6B7280" },
] as const;

export const DEFAULT_COLLECTION_COLOR = "#3B82F6";

export const createCollectionSchema = z.object({
	name: z.string().min(1, "Collection name is required").max(255),
	description: z.string().max(1000).optional(),
	color: z.string().max(20).default(DEFAULT_COLLECTION_COLOR),
	contactIds: z.array(z.string().uuid()).optional(),
});
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;

export const updateCollectionSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).max(255).optional(),
	description: z.string().max(1000).nullable().optional(),
	color: z.string().max(20).optional(),
	contactIds: z.array(z.string().uuid()).optional(),
});
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;

export const deleteCollectionSchema = z.object({
	id: z.string().uuid(),
});

export const deleteCollectionsSchema = z.object({
	ids: z.array(z.string().uuid()).min(1).max(500),
});

export const collectionFiltersSchema = z.object({
	search: z.string().optional(),
	page: z.number().int().positive().default(1),
	pageSize: z.number().int().positive().max(100).default(25),
});
export type CollectionFilters = z.infer<typeof collectionFiltersSchema>;

export const collectionSearchSchema = z.object({
	search: fallback(z.string(), "").default(""),
	page: fallback(z.number().int().positive(), 1).default(1),
	pageSize: fallback(z.number().int().positive().max(100), 25).default(25),
});
export type CollectionSearchParams = z.infer<typeof collectionSearchSchema>;

export const addContactsToCollectionSchema = z.object({
	collectionId: z.string().uuid(),
	contactIds: z.array(z.string().uuid()).min(1),
});
export type AddContactsToCollectionInput = z.infer<
	typeof addContactsToCollectionSchema
>;

export const addContactsToCollectionsSchema = z.object({
	contactIds: z.array(z.string().uuid()).min(1),
	collectionIds: z.array(z.string().uuid()).min(1),
});
export type AddContactsToCollectionsInput = z.infer<
	typeof addContactsToCollectionsSchema
>;

export const removeContactsFromCollectionSchema = z.object({
	collectionId: z.string().uuid(),
	contactIds: z.array(z.string().uuid()).min(1),
});
export type RemoveContactsFromCollectionInput = z.infer<
	typeof removeContactsFromCollectionSchema
>;

export interface Collection {
	id: string;
	name: string;
	description: string;
	color: string;
	contactCount: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface PaginatedCollections {
	data: Collection[];
	total: number;
	page: number;
	pageSize: number;
}
