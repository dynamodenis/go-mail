import { z } from "zod";

export const createEmailScheduleSchema = z.object({
	subject: z.string().min(1, "Subject is required").max(255),
	bodyHtml: z.string().min(1, "Email body is required"),
	bodyJson: z.record(z.unknown()).optional(),
	tiptapReference: z.string().optional(),
	templateId: z.string().uuid().optional(),
	toRecipients: z.array(z.string().email()).min(1, "At least one recipient required"),
	ccRecipients: z.array(z.string().email()).optional(),
	bccRecipients: z.array(z.string().email()).optional(),
	scheduledAt: z.string().datetime({ message: "Valid ISO date required" }),
});

export type CreateEmailScheduleInput = z.infer<typeof createEmailScheduleSchema>;

export const cancelEmailScheduleSchema = z.object({
	id: z.string().uuid(),
});

export const emailScheduleFiltersSchema = z.object({
	status: z.enum(["PENDING", "SENDING", "SENT", "PARTIALLY_SENT", "FAILED", "CANCELLED"]).optional(),
	page: z.coerce.number().int().positive().default(1),
	pageSize: z.coerce.number().int().positive().max(100).default(25),
});

export type EmailScheduleFilters = z.infer<typeof emailScheduleFiltersSchema>;

export interface EmailScheduleItem {
	id: string;
	subject: string;
	recipientCount: number;
	status: string;
	scheduledAt: string;
	sentAt: string | null;
	templateId: string | null;
	tiptapReference: string | null;
	createdAt: string;
}

export interface EmailScheduleDetail extends EmailScheduleItem {
	bodyHtml: string;
	bodyJson: Record<string, unknown>;
	toRecipients: string[];
	ccRecipients: string[];
	bccRecipients: string[];
	failedAt: string | null;
	failureReason: string | null;
}
