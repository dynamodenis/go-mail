import { z } from "zod";

export const templateCategorySchema = z.enum([
  "MARKETING",
  "TRANSACTIONAL",
  "NEWSLETTER",
  "WELCOME",
  "FOLLOW_UP",
  "CUSTOM",
]);
export type TemplateCategory = z.infer<typeof templateCategorySchema>;

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(255),
  subject: z.string().min(1, "Subject line is required").max(255),
  htmlContent: z.string().min(1, "Template content is required"),
  textContent: z.string().optional(),
  category: templateCategorySchema.default("CUSTOM"),
  thumbnailUrl: z.string().url().optional(),
});
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

export const updateTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  subject: z.string().min(1).max(255).optional(),
  htmlContent: z.string().min(1).optional(),
  textContent: z.string().optional(),
  category: templateCategorySchema.optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
});
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

export const templateFiltersSchema = z.object({
  category: templateCategorySchema.optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(25),
});
export type TemplateFilters = z.infer<typeof templateFiltersSchema>;

export interface Template {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  category: TemplateCategory;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
