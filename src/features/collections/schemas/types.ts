import { z } from "zod";

export const createCollectionSchema = z.object({
  name: z.string().min(1, "Collection name is required").max(255),
  description: z.string().max(1000).optional(),
});
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;

export const updateCollectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
});
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;

export const collectionFiltersSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(25),
});
export type CollectionFilters = z.infer<typeof collectionFiltersSchema>;

export const addContactsToCollectionSchema = z.object({
  collectionId: z.string().uuid(),
  contactIds: z.array(z.string().uuid()).min(1),
});
export type AddContactsToCollectionInput = z.infer<
  typeof addContactsToCollectionSchema
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
  description: string | null;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}
