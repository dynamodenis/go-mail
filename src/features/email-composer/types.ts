import { z } from "zod";

export const emailComposerSchema = z.object({
	to: z.array(z.string().email()).min(1, "At least one recipient is required"),
	subject: z.string().min(1, "Subject is required").max(255),
	bodyHtml: z.string().min(1, "Email body is required"),
	bodyJson: z.record(z.string(), z.any()).optional(),
	templateId: z.string().uuid().optional(),
});
export type EmailComposerInput = z.infer<typeof emailComposerSchema>;
