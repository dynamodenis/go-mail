import DOMPurify from "isomorphic-dompurify";
import { AppError } from "@/lib/errors";
import type { EmailName, Message, Thread } from "nylas";
import * as repo from "./repository";
import {
	EMAIL_ERROR,
	type EmailFolder,
	type EmailParticipant,
	type EmailThread,
	type EmailThreadDetail,
	type EmailThreadMessage,
} from "../types";

/** Business logic for email. Maps untrusted Nylas payloads onto the
 *  provider-agnostic shapes the UI renders, sanitizes HTML bodies, and applies
 *  folder/sender rules. No HTTP concerns; the grant id is passed in by the
 *  server layer. */

// ── Mapping helpers ─────────────────────────────────────────────────────────

function toParticipant(name?: EmailName): EmailParticipant {
	return { name: name?.name?.trim() || null, email: name?.email ?? "" };
}

function toParticipants(names?: EmailName[]): EmailParticipant[] {
	return (names ?? []).map(toParticipant);
}

/** Nylas timestamps are Unix seconds; the UI wants ISO strings. */
function toIso(seconds?: number): string {
	return new Date((seconds ?? 0) * 1000).toISOString();
}

/** Email bodies are sender-controlled and untrusted (Nylas skill: treat as
 *  data). Strip scripts/handlers before the HTML can reach the client, per the
 *  CLAUDE.md security rule to sanitize before storing/rendering. */
function sanitizeBody(html?: string): string {
	return DOMPurify.sanitize(html ?? "", {
		FORBID_TAGS: ["style", "script", "iframe"],
		FORBID_ATTR: ["onerror", "onload", "onclick"],
	});
}

/** For inbox we show the latest sender; for sent/drafts we show the recipient. */
function previewParticipant(
	latest: Message | undefined,
	folder: EmailFolder,
): EmailParticipant {
	if (folder === "inbox") return toParticipant(latest?.from?.[0]);
	return toParticipant(latest?.to?.[0]);
}

function toThread(thread: Thread, folder: EmailFolder): EmailThread {
	// latestDraftOrMessage may be a Draft or a Message; both carry from/to.
	const latest = thread.latestDraftOrMessage as Message | undefined;
	const date =
		thread.latestMessageReceivedDate ??
		thread.latestMessageSentDate ??
		thread.earliestMessageDate;

	return {
		id: thread.id,
		subject: thread.subject || "(no subject)",
		snippet: thread.snippet ?? "",
		unread: thread.unread ?? false,
		starred: thread.starred ?? false,
		hasAttachments: thread.hasAttachments ?? false,
		participants: toParticipants(thread.participants),
		preview: previewParticipant(latest, folder),
		date: toIso(date),
		messageCount: thread.messageIds?.length ?? 1,
	};
}

function toThreadMessage(message: Message): EmailThreadMessage {
	return {
		id: message.id,
		from: toParticipant(message.from?.[0]),
		to: toParticipants(message.to),
		cc: toParticipants(message.cc),
		subject: message.subject || "(no subject)",
		body: sanitizeBody(message.body),
		snippet: message.snippet ?? "",
		date: toIso(message.date),
		unread: message.unread ?? false,
	};
}

// ── Operations ──────────────────────────────────────────────────────────────

/** Threads for a folder, optionally filtered by a provider-native search query.
 *  Returns an empty list when the mailbox has no matching folder.
 *  @throws EMAIL_FETCH_FAILED */
export async function getThreads(
	grantId: string,
	folder: EmailFolder,
	search?: string,
): Promise<EmailThread[]> {
	try {
		const folderId = await repo.resolveFolderId(grantId, folder);
		if (!folderId) return [];
		const threads = await repo.listThreads(grantId, folderId, search);
		return threads.map((t) => toThread(t, folder));
	} catch (error) {
		if (error instanceof AppError) throw error;
		throw new AppError(EMAIL_ERROR.FETCH_FAILED, "Couldn't load your email.");
	}
}

/** The fully-expanded thread (messages, oldest first) for the reading pane.
 *  @throws EMAIL_FETCH_FAILED */
export async function getThreadDetail(
	grantId: string,
	threadId: string,
): Promise<EmailThreadDetail> {
	try {
		const [thread, messages] = await Promise.all([
			repo.findThread(grantId, threadId),
			repo.listThreadMessages(grantId, threadId),
		]);

		const ordered = [...messages].sort((a, b) => (a.date ?? 0) - (b.date ?? 0));

		return {
			id: thread.id,
			subject: thread.subject || "(no subject)",
			participants: toParticipants(thread.participants),
			messages: ordered.map(toThreadMessage),
		};
	} catch (error) {
		if (error instanceof AppError) throw error;
		throw new AppError(EMAIL_ERROR.FETCH_FAILED, "Couldn't load this thread.");
	}
}
