import * as repo from "./repository";
import type { CreateEmailScheduleInput, EmailScheduleFilters } from "../types";

/** Business logic for email scheduling. No HTTP or Prisma concerns. */

export async function listSchedules(userId: string, filters: EmailScheduleFilters) {
	const { schedules, total } = await repo.findSchedules(userId, {
		status: filters.status,
		page: filters.page,
		pageSize: filters.pageSize,
	});

	return {
		data: schedules,
		total,
		page: filters.page,
		pageSize: filters.pageSize,
	};
}

export async function getSchedule(userId: string, id: string) {
	const schedule = await repo.findScheduleById(userId, id);
	if (!schedule) {
		throw new Error("SCHEDULE_NOT_FOUND");
	}
	return schedule;
}

export async function createSchedule(userId: string, input: CreateEmailScheduleInput) {
	const scheduledAt = new Date(input.scheduledAt);

	if (scheduledAt <= new Date()) {
		throw new Error("SCHEDULE_IN_PAST");
	}

	return repo.createSchedule(userId, {
		subject: input.subject,
		bodyHtml: input.bodyHtml,
		bodyJson: input.bodyJson,
		tiptapReference: input.tiptapReference,
		templateId: input.templateId,
		toRecipients: input.toRecipients,
		ccRecipients: input.ccRecipients ?? [],
		bccRecipients: input.bccRecipients ?? [],
		scheduledAt,
	});
}

export async function cancelSchedule(userId: string, id: string) {
	const cancelled = await repo.cancelSchedule(userId, id);
	if (!cancelled) {
		throw new Error("SCHEDULE_NOT_FOUND_OR_NOT_PENDING");
	}
	return cancelled;
}
