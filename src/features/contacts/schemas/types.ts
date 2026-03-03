import { z } from "zod";
import { fallback } from "@tanstack/zod-adapter";

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
  phone: z.string().max(50).optional(),
  company: z.string().max(255).optional(),
  status: contactStatusSchema.default("ACTIVE"),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});
export type CreateContactInput = z.infer<typeof createContactSchema> & {
  userId?: string;
};

export const updateContactSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  firstName: z.string().max(255).nullable().optional(),
  lastName: z.string().max(255).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  company: z.string().max(255).nullable().optional(),
  status: contactStatusSchema.optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});
export type UpdateContactInput = z.infer<typeof updateContactSchema>;

export const deleteContactSchema = z.object({
  id: z.string().uuid(),
});

export const deleteContactsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
});

export const contactFiltersSchema = z.object({
  status: contactStatusSchema.optional(),
  search: z.string().optional(),
  collectionId: z.string().uuid().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(25),
});
export type ContactFilters = z.infer<typeof contactFiltersSchema>;

export const contactSearchSchema = z.object({
  search: fallback(z.string(), "").default(""),
  status: fallback(contactStatusSchema.optional(), undefined),
  page: fallback(z.number().int().positive(), 1).default(1),
  pageSize: fallback(z.number().int().positive().max(100), 25).default(25),
});
export type ContactSearchParams = z.infer<typeof contactSearchSchema>;

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
  phone: string | null;
  company: string | null;
  status: ContactStatus;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedContacts {
  data: Contact[];
  total: number;
  page: number;
  pageSize: number;
}
