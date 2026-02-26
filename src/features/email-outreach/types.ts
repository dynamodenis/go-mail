import { z } from "zod";

// Aligned to Prisma TemplateCategory enum
export const templateCategorySchema = z.enum([
	"PROMOTIONAL",
	"NEWSLETTER",
	"ONBOARDING",
	"TRANSACTIONAL",
]);
export type TemplateCategory = z.infer<typeof templateCategorySchema>;

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
	PROMOTIONAL: "Promotional",
	NEWSLETTER: "Newsletter",
	ONBOARDING: "Onboarding",
	TRANSACTIONAL: "Transactional",
};

export const createTemplateSchema = z.object({
	name: z.string().min(1, "Template name is required").max(255),
	subject: z.string().min(1, "Subject line is required").max(255),
	bodyHtml: z.string().min(1, "Template content is required"),
	bodyJson: z.record(z.string(), z.any()).optional(),
	category: templateCategorySchema.default("PROMOTIONAL"),
	mergeTags: z
		.array(z.object({ label: z.string().min(1), value: z.string().min(1) }))
		.optional(),
});
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

export const updateTemplateSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).max(255).optional(),
	subject: z.string().min(1).max(255).optional(),
	bodyHtml: z.string().min(1).optional(),
	bodyJson: z.record(z.string(), z.any()).optional(),
	category: templateCategorySchema.optional(),
});
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

export const templateFiltersSchema = z.object({
	category: templateCategorySchema.optional(),
	search: z.string().optional(),
	page: z.number().int().positive().default(1),
	pageSize: z.number().int().positive().max(100).default(25),
});
export type TemplateFilters = z.infer<typeof templateFiltersSchema>;

export interface TemplateAttachment {
	id: string;
	templateId: string;
	fileName: string;
	fileUrl: string;
	fileSize: number;
	mimeType: string;
	createdAt: string;
}

export interface TemplateMergeTag {
	id: string;
	templateId: string;
	label: string;
	value: string;
	createdAt: string;
}

export interface Template {
	id: string;
	name: string;
	subject: string;
	bodyHtml: string;
	bodyJson: Record<string, NonNullable<unknown>>;
	category: TemplateCategory;
	thumbnailUrl: string | null;
	timesUsed: number;
	attachmentCount?: number;
	attachments?: TemplateAttachment[];
	mergeTags?: TemplateMergeTag[];
	createdAt: string;
	updatedAt: string;
}

export interface TemplateListResponse {
	data: Template[];
	total: number;
	page: number;
	pageSize: number;
}

export interface MergeTagDefinition {
	label: string;
	value: string;
}

export const AVAILABLE_MERGE_TAGS: MergeTagDefinition[] = [
	{ label: "First Name", value: "{first_name}" },
	{ label: "Full Name", value: "{full_name}" },
	{ label: "Email", value: "{email}" },
];

export const addAttachmentSchema = z.object({
	templateId: z.string().uuid(),
	fileName: z.string().min(1),
	fileUrl: z.string().url(),
	fileSize: z.number().int().positive(),
	mimeType: z.string().min(1),
});
export type AddAttachmentInput = z.infer<typeof addAttachmentSchema>;

export const removeAttachmentSchema = z.object({
	attachmentId: z.string().uuid(),
});
export type RemoveAttachmentInput = z.infer<typeof removeAttachmentSchema>;

export const createMergeTagSchema = z.object({
	templateId: z.string().uuid(),
	label: z.string().min(1),
	value: z.string().min(1),
});
export type CreateMergeTagInput = z.infer<typeof createMergeTagSchema>;

export const removeMergeTagSchema = z.object({
	tagId: z.string().uuid(),
});
export type RemoveMergeTagInput = z.infer<typeof removeMergeTagSchema>;

export const DEFAULT_PAGE_SIZE = 25;
