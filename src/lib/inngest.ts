import { Inngest } from "inngest";
import type { Plan } from "@prisma/client";

/** Singleton Inngest client. The `id` identifies this codebase to the Inngest
 *  dev runtime and cloud dashboard ("go-mail" appears as the App name). */
export const inngest = new Inngest({ id: "go-send" });

/** The user's plan at the moment the event was published. Carried on every
 *  event so Inngest's throttle/priority expressions (which can't query the DB)
 *  can branch paid vs. free. Read from the User row in the service layer —
 *  never trust client input for this. */
export type Tier = Plan;

/** Event payload types — the Inngest SDK doesn't enforce these at the type
 *  level for us in this setup, but they document the shape used by `send` and
 *  the function handlers. */
export interface BatchCreatedData {
	batchId: string;
	userId: string;
	tier: Tier;
}

export interface RecipientSendData {
	batchId: string;
	recipientId: string;
	userId: string;
	tier: Tier;
}
