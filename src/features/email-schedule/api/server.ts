import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUserId } from "@/lib/require-user";
import {
	createEmailScheduleSchema,
	cancelEmailScheduleSchema,
	emailScheduleFiltersSchema,
} from "../types";
import * as service from "./service";

/**
 * Get a paginated list of scheduled emails for the current user.
 * @auth Required
 */
export const getEmailSchedules = createServerFn({ method: "GET" })
	.inputValidator(
		(data: { status?: string; page?: number; pageSize?: number }) =>
			emailScheduleFiltersSchema.parse(data),
	)
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		return { data: await service.listSchedules(userId, data) };
	});

/**
 * Get a single scheduled email by ID.
 * @auth Required
 * @throws SCHEDULE_NOT_FOUND
 */
export const getEmailScheduleById = createServerFn({ method: "GET" })
	.inputValidator((data: { id: string }) =>
		z.object({ id: z.string().uuid() }).parse(data),
	)
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		return { data: await service.getSchedule(userId, data.id) };
	});

/**
 * Create a new scheduled email with recipients, body, and send time.
 * @auth Required
 * @throws SCHEDULE_IN_PAST
 */
export const createEmailSchedule = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			subject: string;
			bodyHtml: string;
			bodyJson?: Record<string, unknown>;
			tiptapReference?: string;
			templateId?: string;
			toRecipients: string[];
			ccRecipients?: string[];
			bccRecipients?: string[];
			scheduledAt: string;
		}) => createEmailScheduleSchema.parse(data),
	)
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		return { data: await service.createSchedule(userId, data) };
	});

/**
 * Cancel a pending scheduled email.
 * @auth Required
 * @throws SCHEDULE_NOT_FOUND_OR_NOT_PENDING
 */
export const cancelEmailSchedule = createServerFn({ method: "POST" })
	.inputValidator((data: { id: string }) =>
		cancelEmailScheduleSchema.parse(data),
	)
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		return { data: await service.cancelSchedule(userId, data.id) };
	});
