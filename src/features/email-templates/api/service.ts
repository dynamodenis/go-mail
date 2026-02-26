import DOMPurify from "isomorphic-dompurify";
import type {
	CreateTemplateInput,
	UpdateTemplateInput,
	TemplateFilters,
	Template,
	TemplateListResponse,
	TemplateAttachment,
	TemplateMergeTag,
} from "../types";
import * as repo from "./repository";

/** All business logic for templates. No HTTP or auth concerns. */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JsonValue is complex; we cast to our Template shape
function toTemplate(row: Record<string, any>): Template {
	const base: Template = {
		id: row.id,
		name: row.name,
		subject: row.subject,
		bodyHtml: row.bodyHtml,
		bodyJson: (row.bodyJson ?? {}) as Record<string, NonNullable<unknown>>,
		category: row.category as Template["category"],
		thumbnailUrl: row.thumbnailUrl,
		timesUsed: row.timesUsed,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};

	if (row._count?.attachments !== undefined) {
		base.attachmentCount = row._count.attachments;
	}

	if (row.attachments) {
		base.attachments = row.attachments.map(toAttachment);
	}

	if (row.mergeTags) {
		base.mergeTags = row.mergeTags.map(toMergeTag);
	}

	return base;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toAttachment(row: Record<string, any>): TemplateAttachment {
	return {
		id: row.id,
		templateId: row.templateId ?? "",
		fileName: row.fileName,
		fileUrl: row.fileUrl,
		fileSize: row.fileSize,
		mimeType: row.mimeType,
		createdAt:
			row.createdAt instanceof Date
				? row.createdAt.toISOString()
				: row.createdAt,
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMergeTag(row: Record<string, any>): TemplateMergeTag {
	return {
		id: row.id,
		templateId: row.templateId ?? "",
		label: row.label,
		value: row.value,
		createdAt:
			row.createdAt instanceof Date
				? row.createdAt.toISOString()
				: row.createdAt,
	};
}

function sanitizeHtml(html: string): string {
	return DOMPurify.sanitize(html);
}

export async function listTemplates(
	userId: string,
	filters: TemplateFilters,
): Promise<TemplateListResponse> {
	const { templates, total } = await repo.findTemplates(userId, {
		search: filters.search,
		category: filters.category,
		page: filters.page ?? 1,
		pageSize: filters.pageSize ?? 25,
	});

	return {
		data: templates.map(toTemplate),
		total,
		page: filters.page ?? 1,
		pageSize: filters.pageSize ?? 25,
	};
}

export async function getTemplate(
	userId: string,
	id: string,
): Promise<Template> {
	const row = await repo.findTemplateById(userId, id);
	if (!row) {
		throw new Error("TEMPLATE_NOT_FOUND");
	}
	return toTemplate(row);
}

export async function createTemplate(
	userId: string,
	input: CreateTemplateInput,
): Promise<Template> {
	const row = await repo.createTemplate(userId, {
		name: input.name,
		subject: input.subject,
		bodyHtml: sanitizeHtml(input.bodyHtml),
		bodyJson: input.bodyJson,
		category: input.category,
	});

	if (input.mergeTags && input.mergeTags.length > 0) {
		await repo.createMergeTags(userId, row.id, input.mergeTags);
		const refreshed = await repo.findTemplateById(userId, row.id);
		if (refreshed) return toTemplate(refreshed);
	}

	return toTemplate(row);
}

export async function updateTemplate(
	userId: string,
	input: UpdateTemplateInput,
): Promise<Template> {
	const existing = await repo.findTemplateById(userId, input.id);
	if (!existing) {
		throw new Error("TEMPLATE_NOT_FOUND");
	}

	const updateData: Record<string, unknown> = {};
	if (input.name !== undefined) updateData.name = input.name;
	if (input.subject !== undefined) updateData.subject = input.subject;
	if (input.bodyHtml !== undefined)
		updateData.bodyHtml = sanitizeHtml(input.bodyHtml);
	if (input.bodyJson !== undefined) updateData.bodyJson = input.bodyJson;
	if (input.category !== undefined) updateData.category = input.category;

	await repo.updateTemplate(userId, input.id, updateData);
	const updated = await repo.findUpdatedTemplate(userId, input.id);
	if (!updated) {
		throw new Error("TEMPLATE_NOT_FOUND");
	}
	return toTemplate(updated);
}

export async function deleteTemplate(
	userId: string,
	id: string,
): Promise<void> {
	const result = await repo.deleteTemplate(userId, id);
	if (!result) {
		throw new Error("TEMPLATE_NOT_FOUND");
	}
}

// ─── Attachment Operations ──────────────────────────────────────────────────

export async function addAttachment(
	userId: string,
	input: {
		templateId: string;
		fileName: string;
		fileUrl: string;
		fileSize: number;
		mimeType: string;
	},
): Promise<TemplateAttachment> {
	const template = await repo.findTemplateById(userId, input.templateId);
	if (!template) {
		throw new Error("TEMPLATE_NOT_FOUND");
	}
	const row = await repo.addAttachment(userId, input);
	return toAttachment(row);
}

export async function removeAttachment(
	userId: string,
	attachmentId: string,
): Promise<void> {
	const result = await repo.removeAttachment(userId, attachmentId);
	if (!result) {
		throw new Error("ATTACHMENT_NOT_FOUND");
	}
}

// ─── Merge Tag Operations ───────────────────────────────────────────────────

export async function addMergeTag(
	userId: string,
	templateId: string,
	tag: { label: string; value: string },
): Promise<TemplateMergeTag> {
	const template = await repo.findTemplateById(userId, templateId);
	if (!template) {
		throw new Error("TEMPLATE_NOT_FOUND");
	}
	const tags = await repo.createMergeTags(userId, templateId, [tag]);
	const created = tags.find((t) => t.value === tag.value);
	if (!created) {
		throw new Error("MERGE_TAG_CREATE_FAILED");
	}
	return toMergeTag(created);
}

export async function removeMergeTag(
	userId: string,
	tagId: string,
): Promise<void> {
	const result = await repo.removeMergeTag(userId, tagId);
	if (!result) {
		throw new Error("MERGE_TAG_NOT_FOUND");
	}
}
