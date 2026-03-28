import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Pure data-access layer for email schedules. No auth or business logic. */

const SCHEDULE_LIST_SELECT = {
	id: true,
	subject: true,
	recipientCount: true,
	status: true,
	scheduledAt: true,
	sentAt: true,
	templateId: true,
	tiptapReference: true,
	createdAt: true,
} as const;

const SCHEDULE_DETAIL_SELECT = {
	id: true,
	subject: true,
	bodyHtml: true,
	bodyJson: true,
	recipientCount: true,
	status: true,
	scheduledAt: true,
	sentAt: true,
	failedAt: true,
	failureReason: true,
	templateId: true,
	tiptapReference: true,
	toRecipients: true,
	ccRecipients: true,
	bccRecipients: true,
	createdAt: true,
} as const;

interface FindSchedulesParams {
	status?: string;
	page: number;
	pageSize: number;
}

export async function findSchedules(userId: string, params: FindSchedulesParams) {
	const where: Prisma.EmailScheduleWhereInput = {
		userId,
		...(params.status ? { status: params.status as Prisma.EnumEmailScheduleStatusFilter } : {}),
	};

	const [schedules, total] = await Promise.all([
		prisma.emailSchedule.findMany({
			where,
			select: SCHEDULE_LIST_SELECT,
			orderBy: { scheduledAt: "asc" },
			skip: (params.page - 1) * params.pageSize,
			take: params.pageSize,
		}),
		prisma.emailSchedule.count({ where }),
	]);

	return { schedules, total };
}

export async function findScheduleById(userId: string, id: string) {
	return prisma.emailSchedule.findFirst({
		where: { id, userId },
		select: SCHEDULE_DETAIL_SELECT,
	});
}

export async function createSchedule(
	userId: string,
	data: {
		subject: string;
		bodyHtml: string;
		bodyJson?: Record<string, unknown>;
		tiptapReference?: string;
		templateId?: string;
		toRecipients: string[];
		ccRecipients: string[];
		bccRecipients: string[];
		scheduledAt: Date;
	},
) {
	return prisma.emailSchedule.create({
		data: {
			userId,
			subject: data.subject,
			bodyHtml: data.bodyHtml,
			bodyJson: (data.bodyJson ?? {}) as Prisma.InputJsonValue,
			tiptapReference: data.tiptapReference,
			templateId: data.templateId,
			toRecipients: data.toRecipients as unknown as Prisma.InputJsonValue,
			ccRecipients: data.ccRecipients as unknown as Prisma.InputJsonValue,
			bccRecipients: data.bccRecipients as unknown as Prisma.InputJsonValue,
			recipientCount: data.toRecipients.length,
			scheduledAt: data.scheduledAt,
		},
		select: SCHEDULE_DETAIL_SELECT,
	});
}

export async function cancelSchedule(userId: string, id: string) {
	const schedule = await prisma.emailSchedule.findFirst({
		where: { id, userId, status: "PENDING" },
		select: { id: true },
	});

	if (!schedule) return null;

	return prisma.emailSchedule.update({
		where: { id },
		data: { status: "CANCELLED" },
		select: SCHEDULE_LIST_SELECT,
	});
}
