import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { TemplateCategory } from "../types";

/** Pure data-access layer for templates. No auth checks or business logic. */

const TEMPLATE_LIST_SELECT = {
	id: true,
	name: true,
	subject: true,
	bodyHtml: true,
	bodyJson: true,
	category: true,
	thumbnailUrl: true,
	timesUsed: true,
	createdAt: true,
	updatedAt: true,
	_count: { select: { attachments: true } },
} as const;

const TEMPLATE_DETAIL_SELECT = {
	id: true,
	name: true,
	subject: true,
	bodyHtml: true,
	bodyJson: true,
	category: true,
	thumbnailUrl: true,
	timesUsed: true,
	createdAt: true,
	updatedAt: true,
	attachments: {
		select: {
			id: true,
			fileName: true,
			fileUrl: true,
			fileSize: true,
			mimeType: true,
			createdAt: true,
		},
		orderBy: { createdAt: "desc" as const },
	},
	mergeTags: {
		select: {
			id: true,
			label: true,
			value: true,
			createdAt: true,
		},
		orderBy: { createdAt: "asc" as const },
	},
} as const;

interface FindTemplatesParams {
	search?: string;
	category?: TemplateCategory;
	page: number;
	pageSize: number;
}

export async function findTemplates(
	userId: string,
	params: FindTemplatesParams,
) {
	const where = {
		userId,
		...(params.search
			? { name: { contains: params.search, mode: "insensitive" as const } }
			: {}),
		...(params.category ? { category: params.category } : {}),
	};

	const [templates, total] = await Promise.all([
		prisma.template.findMany({
			where,
			select: TEMPLATE_LIST_SELECT,
			orderBy: { updatedAt: "desc" },
			skip: (params.page - 1) * params.pageSize,
			take: params.pageSize,
		}),
		prisma.template.count({ where }),
	]);

	return { templates, total };
}

export async function findTemplateById(userId: string, templateId: string) {
	return prisma.template.findFirst({
		where: { id: templateId, userId },
		select: TEMPLATE_DETAIL_SELECT,
	});
}

export async function createTemplate(
	userId: string,
	data: {
		name: string;
		subject: string;
		bodyHtml: string;
		bodyJson?: Record<string, unknown>;
		category: TemplateCategory;
	},
) {
	return prisma.template.create({
		data: {
			userId,
			name: data.name,
			subject: data.subject,
			bodyHtml: data.bodyHtml,
			bodyJson: (data.bodyJson ?? {}) as Prisma.InputJsonValue,
			category: data.category,
		},
		select: TEMPLATE_DETAIL_SELECT,
	});
}

export async function updateTemplate(
	userId: string,
	templateId: string,
	data: Record<string, unknown>,
) {
	return prisma.template.updateMany({
		where: { id: templateId, userId },
		data: data as Parameters<typeof prisma.template.updateMany>[0]["data"],
	});
}

export async function findUpdatedTemplate(
	userId: string,
	templateId: string,
) {
	return prisma.template.findFirst({
		where: { id: templateId, userId },
		select: TEMPLATE_DETAIL_SELECT,
	});
}

export async function deleteTemplate(userId: string, templateId: string) {
	const template = await prisma.template.findFirst({
		where: { id: templateId, userId },
		select: { id: true },
	});

	if (!template) return null;

	await prisma.template.delete({ where: { id: templateId } });
	return template;
}

// ─── Attachment CRUD ────────────────────────────────────────────────────────

export async function addAttachment(
	userId: string,
	data: {
		templateId: string;
		fileName: string;
		fileUrl: string;
		fileSize: number;
		mimeType: string;
	},
) {
	return prisma.templateAttachment.create({
		data: {
			userId,
			templateId: data.templateId,
			fileName: data.fileName,
			fileUrl: data.fileUrl,
			fileSize: data.fileSize,
			mimeType: data.mimeType,
		},
		select: {
			id: true,
			fileName: true,
			fileUrl: true,
			fileSize: true,
			mimeType: true,
			createdAt: true,
		},
	});
}

export async function removeAttachment(userId: string, attachmentId: string) {
	const attachment = await prisma.templateAttachment.findFirst({
		where: { id: attachmentId, userId },
		select: { id: true },
	});
	if (!attachment) return null;

	await prisma.templateAttachment.delete({ where: { id: attachmentId } });
	return attachment;
}

// ─── Merge Tag CRUD ─────────────────────────────────────────────────────────

export async function createMergeTags(
	userId: string,
	templateId: string,
	tags: { label: string; value: string }[],
) {
	if (tags.length === 0) return [];

	await prisma.templateMergeTag.createMany({
		data: tags.map((tag) => ({
			userId,
			templateId,
			label: tag.label,
			value: tag.value,
		})),
		skipDuplicates: true,
	});

	return prisma.templateMergeTag.findMany({
		where: { templateId, userId },
		select: { id: true, label: true, value: true, createdAt: true },
		orderBy: { createdAt: "asc" },
	});
}

export async function removeMergeTag(userId: string, tagId: string) {
	const tag = await prisma.templateMergeTag.findFirst({
		where: { id: tagId, userId },
		select: { id: true },
	});
	if (!tag) return null;

	await prisma.templateMergeTag.delete({ where: { id: tagId } });
	return tag;
}

export async function findMergeTagsByTemplateId(
	userId: string,
	templateId: string,
) {
	return prisma.templateMergeTag.findMany({
		where: { templateId, userId },
		select: { id: true, label: true, value: true, createdAt: true },
		orderBy: { createdAt: "asc" },
	});
}
