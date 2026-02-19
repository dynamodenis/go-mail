import { z } from "zod";

export const contactStatusSchema = z.enum([
  "ACTIVE",
  "UNSUBSCRIBED",
  "BOUNCED",
  "CLEANED",
]);
export type ContactStatus = z.infer<typeof contactStatusSchema>;

export const createContactSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().max(255).optional(),
  lastName: z.string().max(255).optional(),
  status: contactStatusSchema.default("ACTIVE"),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateContactInput = z.infer<typeof createContactSchema>;

export const updateContactSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  firstName: z.string().max(255).nullable().optional(),
  lastName: z.string().max(255).nullable().optional(),
  status: contactStatusSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type UpdateContactInput = z.infer<typeof updateContactSchema>;

export const contactFiltersSchema = z.object({
  status: contactStatusSchema.optional(),
  search: z.string().optional(),
  collectionId: z.string().uuid().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(25),
});
export type ContactFilters = z.infer<typeof contactFiltersSchema>;

export const importContactsSchema = z.object({
  collectionId: z.string().uuid().optional(),
  contacts: z.array(createContactSchema).min(1).max(10000),
});
export type ImportContactsInput = z.infer<typeof importContactsSchema>;

export interface Contact {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: ContactStatus;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
