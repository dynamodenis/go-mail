import { z } from "zod";

export const calendarViewSchema = z.enum(["month", "week", "day"]);
export type CalendarView = z.infer<typeof calendarViewSchema>;

export const calendarEventStatusSchema = z.enum([
  "CONFIRMED",
  "TENTATIVE",
  "CANCELLED",
]);
export type CalendarEventStatus = z.infer<typeof calendarEventStatusSchema>;

export const calendarFiltersSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  calendarId: z.string().optional(),
});
export type CalendarFilters = z.infer<typeof calendarFiltersSchema>;

export const createCalendarEventSchema = z.object({
  title: z.string().min(1, "Event title is required").max(255),
  description: z.string().max(5000).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().max(500).optional(),
  participants: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
      })
    )
    .optional(),
  isAllDay: z.boolean().default(false),
});
export type CreateCalendarEventInput = z.infer<
  typeof createCalendarEventSchema
>;

export const updateCalendarEventSchema = z.object({
  eventId: z.string(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).nullable().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  location: z.string().max(500).nullable().optional(),
  participants: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
      })
    )
    .optional(),
  status: calendarEventStatusSchema.optional(),
});
export type UpdateCalendarEventInput = z.infer<
  typeof updateCalendarEventSchema
>;

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  location: string | null;
  status: CalendarEventStatus;
  isAllDay: boolean;
  participants: CalendarParticipant[];
  createdAt: string;
  updatedAt: string;
}

export interface CalendarParticipant {
  email: string;
  name: string | null;
  status: "yes" | "no" | "maybe" | "pending";
}
