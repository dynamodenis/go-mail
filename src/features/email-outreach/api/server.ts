import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/integrations/supabase/server";
import {
	templateFiltersSchema,
	createTemplateSchema,
	updateTemplateSchema,
	addAttachmentSchema,
	removeAttachmentSchema,
	createMergeTagSchema,
	removeMergeTagSchema,
	type Template,
	type TemplateListResponse,
	type TemplateAttachment,
	type TemplateMergeTag,
} from "../types";
import * as service from "./service";

/**
 * Authenticate the current user and return their ID.
 * Throws if not authenticated.
 */
async function requireUserId(): Promise<string> {
	const supabase = getSupabaseServerClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		throw new Error("UNAUTHORIZED");
	}
	return user.id;
}

/**
 * Get a paginated, filterable list of templates for the current user.
 * @auth Required
 * @throws UNAUTHORIZED
 */
export const getTemplates = createServerFn({ method: "GET" })
	.inputValidator(
		(data: {
			search?: string;
			category?: string;
			page?: number;
			pageSize?: number;
		}) => templateFiltersSchema.parse(data),
	)
	.handler(async ({ data }): Promise<{ data: TemplateListResponse }> => {
		const userId = await requireUserId();
		return { data: await service.listTemplates(userId, data) };
	});

/**
 * Get a single template by ID.
 * @auth Required
 * @throws UNAUTHORIZED, TEMPLATE_NOT_FOUND
 */
export const getTemplateById = createServerFn({ method: "GET" })
	.inputValidator((data: { id: string }) =>
		z.object({ id: z.string().uuid() }).parse(data),
	)
	.handler(async ({ data }): Promise<{ data: Template }> => {
		const userId = await requireUserId();
		return { data: await service.getTemplate(userId, data.id) };
	});

/**
 * Create a new template, optionally with merge tags.
 * @auth Required
 * @throws UNAUTHORIZED
 */
export const createTemplate = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			name: string;
			subject: string;
			bodyHtml: string;
			bodyJson?: Record<string, unknown>;
			category?: string;
			mergeTags?: { label: string; value: string }[];
		}) => createTemplateSchema.parse(data),
	)
	.handler(async ({ data }): Promise<{ data: Template }> => {
		const userId = await requireUserId();
		return { data: await service.createTemplate(userId, data) };
	});

/**
 * Update an existing template.
 * @auth Required
 * @throws UNAUTHORIZED, TEMPLATE_NOT_FOUND
 */
export const updateTemplate = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			id: string;
			name?: string;
			subject?: string;
			bodyHtml?: string;
			bodyJson?: Record<string, unknown>;
			category?: string;
		}) => updateTemplateSchema.parse(data),
	)
	.handler(async ({ data }): Promise<{ data: Template }> => {
		const userId = await requireUserId();
		return { data: await service.updateTemplate(userId, data) };
	});

/**
 * Delete a template by ID.
 * @auth Required
 * @throws UNAUTHORIZED, TEMPLATE_NOT_FOUND
 */
export const deleteTemplate = createServerFn({ method: "POST" })
	.inputValidator((data: { id: string }) =>
		z.object({ id: z.string().uuid() }).parse(data),
	)
	.handler(async ({ data }): Promise<{ data: { success: boolean } }> => {
		const userId = await requireUserId();
		await service.deleteTemplate(userId, data.id);
		return { data: { success: true } };
	});

/**
 * Add an attachment to a template.
 * @auth Required
 * @throws UNAUTHORIZED, TEMPLATE_NOT_FOUND
 */
export const addTemplateAttachment = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			templateId: string;
			fileName: string;
			fileUrl: string;
			fileSize: number;
			mimeType: string;
		}) => addAttachmentSchema.parse(data),
	)
	.handler(async ({ data }): Promise<{ data: TemplateAttachment }> => {
		const userId = await requireUserId();
		return { data: await service.addAttachment(userId, data) };
	});

/**
 * Remove an attachment from a template.
 * @auth Required
 * @throws UNAUTHORIZED, ATTACHMENT_NOT_FOUND
 */
export const removeTemplateAttachment = createServerFn({ method: "POST" })
	.inputValidator((data: { attachmentId: string }) =>
		removeAttachmentSchema.parse(data),
	)
	.handler(async ({ data }): Promise<{ data: { success: boolean } }> => {
		const userId = await requireUserId();
		await service.removeAttachment(userId, data.attachmentId);
		return { data: { success: true } };
	});

/**
 * Add a custom merge tag to a template.
 * @auth Required
 * @throws UNAUTHORIZED, TEMPLATE_NOT_FOUND
 */
export const addTemplateMergeTag = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { templateId: string; label: string; value: string }) =>
			createMergeTagSchema.parse(data),
	)
	.handler(async ({ data }): Promise<{ data: TemplateMergeTag }> => {
		const userId = await requireUserId();
		return {
			data: await service.addMergeTag(userId, data.templateId, {
				label: data.label,
				value: data.value,
			}),
		};
	});

/**
 * Remove a custom merge tag.
 * @auth Required
 * @throws UNAUTHORIZED, MERGE_TAG_NOT_FOUND
 */
export const removeTemplateMergeTag = createServerFn({ method: "POST" })
	.inputValidator((data: { tagId: string }) =>
		removeMergeTagSchema.parse(data),
	)
	.handler(async ({ data }): Promise<{ data: { success: boolean } }> => {
		const userId = await requireUserId();
		await service.removeMergeTag(userId, data.tagId);
		return { data: { success: true } };
	});
