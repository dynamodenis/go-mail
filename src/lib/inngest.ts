import { Inngest } from "inngest";

/** Singleton Inngest client. The `id` identifies this codebase to the Inngest
 *  dev runtime and cloud dashboard ("go-mail" appears as the App name). */
export const inngest = new Inngest({ id: "go-send" });

/** Event payload types — the Inngest SDK doesn't enforce these at the type
 *  level for us in this setup, but they document the shape used by `send` and
 *  the function handlers. */
export interface BatchCreatedData {
	batchId: string;
	userId: string;
}

export interface RecipientSendData {
	batchId: string;
	recipientId: string;
	userId: string;
}
