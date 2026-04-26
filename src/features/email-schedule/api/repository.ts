import type { Prisma, EmailBatchStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Pure data-access layer for email batches and recipients. No auth or business logic. */

const BATCH_LIST_SELECT = {
	id: true,
	subject: true,
	totalRecipients: true,
	sentCount: true,
	failedCount: true,
	status: true,
	scheduledAt: true,
	createdAt: true,
} as const;

const BATCH_DETAIL_SELECT = {
	id: true,
	subject: true,
	bodyHtml: true,
	bodyJson: true,
	tiptapReference: true,
	templateId: true,
	ccRecipients: true,
	bccRecipients: true,
	totalRecipients: true,
	sentCount: true,
	failedCount: true,
	status: true,
	scheduledAt: true,
	createdAt: true,
	sources: {
		select: {
			id: true,
			type: true,
			collectionId: true,
			email: true,
			name: true,
		},
	},
} as const;

const RECIPIENT_SELECT = {
	id: true,
	recipientEmail: true,
	recipientName: true,
	status: true,
	sentAt: true,
	failedAt: true,
	failureReason: true,
} as const;

interface FindBatchesParams {
	status?: string;
	page: number;
	pageSize: number;
}

export async function createBatch(
	userId: string,
	data: {
		subject: string;
		bodyHtml: string;
		bodyJson?: Record<string, unknown>;
		tiptapReference?: string;
		templateId?: string;
		ccRecipients: string[];
		bccRecipients: string[];
		scheduledAt: Date | null;
		sources: Array<
			| { type: "COLLECTION"; collectionId: string }
			| { type: "INDIVIDUAL"; email: string; name?: string }
		>;
	},
) {
	return prisma.emailBatch.create({
		data: {
			userId,
			subject: data.subject,
			bodyHtml: data.bodyHtml,
			bodyJson: (data.bodyJson ?? {}) as Prisma.InputJsonValue,
			tiptapReference: data.tiptapReference,
			templateId: data.templateId,
			ccRecipients: data.ccRecipients as unknown as Prisma.InputJsonValue,
			bccRecipients: data.bccRecipients as unknown as Prisma.InputJsonValue,
			scheduledAt: data.scheduledAt,
			sources: {
				create: data.sources.map((s) =>
					s.type === "COLLECTION"
						? { type: "COLLECTION" as const, collectionId: s.collectionId }
						: { type: "INDIVIDUAL" as const, email: s.email, name: s.name },
				),
			},
		},
		select: { id: true, status: true },
	});
}

export async function findBatches(userId: string, params: FindBatchesParams) {
	const where: Prisma.EmailBatchWhereInput = {
		userId,
		...(params.status
			? { status: params.status as Prisma.EnumEmailBatchStatusFilter }
			: {}),
	};

	const [batches, total] = await Promise.all([
		prisma.emailBatch.findMany({
			where,
			select: BATCH_LIST_SELECT,
			orderBy: { createdAt: "desc" },
			skip: (params.page - 1) * params.pageSize,
			take: params.pageSize,
		}),
		prisma.emailBatch.count({ where }),
	]);

	return { batches, total };
}

export async function findBatchById(userId: string, id: string) {
	return prisma.emailBatch.findFirst({
		where: { id, userId },
		select: BATCH_DETAIL_SELECT,
	});
}

export async function cancelBatch(userId: string, id: string) {
	const batch = await prisma.emailBatch.findFirst({
		where: { id, userId, status: { in: ["PENDING", "EXPANDING"] } },
		select: { id: true },
	});

	if (!batch) return null;

	const [updated] = await prisma.$transaction([
		prisma.emailBatch.update({
			where: { id },
			data: { status: "CANCELLED" },
			select: BATCH_LIST_SELECT,
		}),
		prisma.emailSchedule.updateMany({
			where: { batchId: id, status: "PENDING" },
			data: { status: "FAILED", failureReason: "Batch cancelled" },
		}),
	]);

	return updated;
}

export async function updateBatchStatus(id: string, status: EmailBatchStatus) {
	return prisma.emailBatch.update({
		where: { id },
		data: { status },
	});
}

export async function getBatchSources(batchId: string) {
	return prisma.emailBatchSource.findMany({
		where: { batchId },
		select: { id: true, type: true, collectionId: true, email: true, name: true },
	});
}

const RECIPIENT_CHUNK_SIZE = 1000;

export interface RecipientRow {
	email: string;
	name?: string | null;
	mergeData?: Record<string, string | null>;
}

export async function createRecipientRows(
	batchId: string,
	userId: string,
	recipients: Array<RecipientRow>,
) {
	let created = 0;

	for (let i = 0; i < recipients.length; i += RECIPIENT_CHUNK_SIZE) {
		const chunk = recipients.slice(i, i + RECIPIENT_CHUNK_SIZE);
		const result = await prisma.emailSchedule.createMany({
			data: chunk.map((r) => ({
				batchId,
				userId,
				recipientEmail: r.email,
				recipientName: r.name ?? null,
				mergeData: (r.mergeData ?? {}) as Prisma.InputJsonValue,
			})),
		});
		created += result.count;
	}

	return created;
}

export async function updateBatchTotalRecipients(id: string, count: number) {
	return prisma.emailBatch.update({
		where: { id },
		data: { totalRecipients: count },
	});
}

export async function findBatchRecipients(
	batchId: string,
	params: { status?: string; page: number; pageSize: number },
) {
	const where: Prisma.EmailScheduleWhereInput = {
		batchId,
		...(params.status
			? { status: params.status as Prisma.EnumEmailRecipientStatusFilter }
			: {}),
	};

	const [recipients, total] = await Promise.all([
		prisma.emailSchedule.findMany({
			where,
			select: RECIPIENT_SELECT,
			orderBy: { createdAt: "asc" },
			skip: (params.page - 1) * params.pageSize,
			take: params.pageSize,
		}),
		prisma.emailSchedule.count({ where }),
	]);

	return { recipients, total };
}

export async function markRecipientSent(id: string) {
	return prisma.emailSchedule.update({
		where: { id },
		data: { status: "SENT", sentAt: new Date() },
	});
}

export async function markRecipientFailed(id: string, reason: string) {
	return prisma.emailSchedule.update({
		where: { id },
		data: { status: "FAILED", failedAt: new Date(), failureReason: reason },
	});
}

export async function incrementBatchCounters(
	batchId: string,
	sent: number,
	failed: number,
) {
	return prisma.emailBatch.update({
		where: { id: batchId },
		data: {
			sentCount: { increment: sent },
			failedCount: { increment: failed },
		},
	});
}
