import { AppError } from "@/lib/errors";
import DOMPurify from "isomorphic-dompurify";
import type { EmailName, Folder, Message, Thread } from "nylas";
import {
	ATTRIBUTE_ROLE,
	DONE_FOLDER_ID,
	EMAIL_ERROR,
	type EmailFolderItem,
	type EmailParticipant,
	type EmailThread,
	type EmailThreadDetail,
	type EmailThreadMessage,
	FOLDER_NAME_OVERRIDES,
	type FolderRole,
	ROLE_LABEL,
	SYSTEM_ROLE_ORDER,
	type SendEmailPayload,
} from "../types";
import * as repo from "./repository";

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

/** In sender-oriented folders we show the latest sender; in sent/drafts we show
 *  the recipient, since the user is the sender there. */
function previewParticipant(
	latest: Message | undefined,
	role: FolderRole,
): EmailParticipant {
	if (role === "sent" || role === "drafts") {
		return toParticipant(latest?.to?.[0]);
	}
	return toParticipant(latest?.from?.[0]);
}

function toThread(thread: Thread, role: FolderRole): EmailThread {
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
		preview: previewParticipant(latest, role),
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

// ── Folder mapping ───────────────────────────────────────────────────────────

/** Classifies a provider folder into one of our roles. Prefers the IMAP
 *  special-use attribute Nylas normalizes across providers, falling back to a
 *  name match for providers that omit attributes. */
function detectRole(folder: Folder): FolderRole {
	for (const attribute of folder.attributes ?? []) {
		const role = ATTRIBUTE_ROLE[attribute];
		if (role) return role;
	}
	switch (folder.name?.toUpperCase()) {
		case "INBOX":
			return "inbox";
		case "SENT":
			return "sent";
		case "DRAFT":
		case "DRAFTS":
			return "drafts";
		case "STARRED":
			return "starred";
		case "SNOOZED":
			return "snoozed";
		case "IMPORTANT":
			return "important";
		case "UNREAD":
			return "unread";
		case "SCHEDULED":
			return "scheduled";
		case "CHAT":
		case "CHATS":
			return "chats";
		case "JUNK":
		case "SPAM":
			return "spam";
		case "TRASH":
			return "trash";
		case "ALL MAIL":
		case "ARCHIVE":
			return "archive";
		default:
			return "custom";
	}
}

/** Whether a folder is a provider system folder (vs the user's own label). Uses
 *  Google's `systemFolder` flag when present; otherwise infers it from a known
 *  role or a Gmail category name. User labels render in their own section. */
function isSystemFolder(folder: Folder, role: FolderRole): boolean {
	if (role !== "custom") return true;
	if (folder.systemFolder) return true;
	return (folder.name ?? "").toUpperCase().startsWith("CATEGORY_");
}

/** Display name for a folder: a friendly label for system roles, a prettified
 *  name for Gmail's category labels, and the full provider path for the user's
 *  own labels (the sidebar splits that path into a nested tree). */
function folderName(folder: Folder, role: FolderRole): string {
	if (role !== "custom") return ROLE_LABEL[role];
	const raw = folder.name || "Untitled";
	return FOLDER_NAME_OVERRIDES[raw.toUpperCase()] ?? raw;
}

function toFolderItem(folder: Folder, role: FolderRole): EmailFolderItem {
	return {
		id: folder.id,
		name: folderName(folder, role),
		role,
		system: isSystemFolder(folder, role),
		unreadCount: folder.unreadCount ?? 0,
	};
}

// ── Operations ──────────────────────────────────────────────────────────────

/** Every folder on the mailbox for the sidebar. Sorted so the UI can lay it out
 *  Gmail-style: system folders first in a deliberate order (Inbox, Starred,
 *  Snoozed, Sent, Drafts, then the rest), the user's labels after, alphabetically.
 *  Nothing is hidden — the sidebar pins the everyday folders, tucks the other
 *  system ones under "More", and lists labels in their own (nested) section.
 *  @throws EMAIL_FETCH_FAILED */
export async function getFolders(grantId: string): Promise<EmailFolderItem[]> {
	try {
		const folders = await repo.listFolders(grantId);
		const items = folders.map((folder) =>
			toFolderItem(folder, detectRole(folder)),
		);
		// Gmail exposes no archive folder (archiving just drops the INBOX label),
		// so threads marked Done would be unreachable. Inject a virtual Done entry
		// that getThreads resolves to an archived-threads search. Its badge is
		// counted by search too (no folder = no provider count) and tallies ALL
		// done threads, not just unread — marking done usually implies read, so an
		// unread badge would never move. The badge is decoration, so a failed
		// count falls back to 0 rather than failing the whole sidebar.
		if (!items.some((f) => f.role === "archive")) {
			const unreadCount = await repo
				.countArchivedThreads(grantId)
				.catch(() => 0);
			items.push({
				id: DONE_FOLDER_ID,
				name: ROLE_LABEL.archive,
				role: "archive",
				system: true,
				unreadCount,
			});
		}
		return items.sort((a, b) => {
			// System folders before user labels.
			if (a.system !== b.system) return a.system ? -1 : 1;
			// Within system, the deliberate Gmail order; labels by name.
			const byRole = SYSTEM_ROLE_ORDER[a.role] - SYSTEM_ROLE_ORDER[b.role];
			return byRole !== 0 ? byRole : a.name.localeCompare(b.name);
		});
	} catch (error) {
		if (error instanceof AppError) throw error;
		throw new AppError(EMAIL_ERROR.FETCH_FAILED, "Couldn't load your folders.");
	}
}

/** Threads in a folder, optionally filtered by a provider-native search query.
 *  `role` only affects the list-row preview (sender vs recipient).
 *  @throws EMAIL_FETCH_FAILED */
export async function getThreads(
	grantId: string,
	folderId: string,
	role: FolderRole,
	search?: string,
): Promise<EmailThread[]> {
	try {
		// The virtual Done folder has no provider folder behind it (Gmail) — an
		// archived thread is one in no other system context, so list by search.
		const threads =
			folderId === DONE_FOLDER_ID
				? await repo.listArchivedThreads(grantId, search)
				: await repo.listThreads(grantId, folderId, search);
		return threads.map((t) => toThread(t, role));
	} catch (error) {
		if (error instanceof AppError) throw error;
		throw new AppError(EMAIL_ERROR.FETCH_FAILED, "Couldn't load your email.");
	}
}

/** Marks a thread "Done" — i.e. archives it on the provider. There is no real
 *  "Done" folder anywhere; Done is a UI concept that maps to archiving:
 *  - Label providers (Gmail): a thread can carry several labels, so we drop the
 *    inbox label and keep the rest — Gmail's native archive behavior.
 *  - Single-folder providers (Outlook/IMAP): removing the inbox leaves the
 *    thread nowhere, so we move it into the provider's archive folder instead.
 *  @throws EMAIL_UPDATE_FAILED */
export async function archiveThread(
	grantId: string,
	threadId: string,
): Promise<void> {
	try {
		const [folders, thread] = await Promise.all([
			repo.listFolders(grantId),
			repo.findThread(grantId, threadId),
		]);

		const inboxId = folders.find((f) => detectRole(f) === "inbox")?.id;
		const remaining = (thread.folders ?? []).filter((id) => id !== inboxId);

		if (remaining.length === 0) {
			// Prefer a dedicated \Archive folder (Outlook/IMAP/iCloud) over Gmail's
			// \All ("All Mail"), which is a view rather than an assignable label.
			const archive =
				folders.find((f) => f.attributes?.includes("\\Archive")) ??
				folders.find((f) => detectRole(f) === "archive");
			if (archive && !archive.attributes?.includes("\\All")) {
				remaining.push(archive.id);
			}
			// Gmail with no other labels: an empty set is valid and means
			// "archived" — the thread remains reachable via All Mail.
		}

		await repo.updateThreadFolders(grantId, threadId, remaining);
	} catch (error) {
		if (error instanceof AppError) throw error;
		throw new AppError(
			EMAIL_ERROR.UPDATE_FAILED,
			"Couldn't mark this thread as done.",
		);
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

// ── Sending ─────────────────────────────────────────────────────────────────

/** The composer authors plain text, but providers expect HTML bodies: escape
 *  everything, then turn newlines into <br>. DOMPurify afterwards is belt and
 *  braces (CLAUDE.md: sanitize before it leaves the app). */
function renderOutgoingBody(text: string): string {
	const escaped = text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
	return DOMPurify.sanitize(escaped.replace(/\r?\n/g, "<br>"));
}

/** Sends a message from the given grant. Files are converted to Buffers here —
 *  the repository hands them to the Nylas SDK, which switches to multipart
 *  once the payload passes 3 MB (25 MB hard cap, validated by the server
 *  layer before this runs).
 *  @throws EMAIL_SEND_FAILED */
export async function sendEmail(
	grantId: string,
	input: SendEmailPayload,
	files: File[],
): Promise<void> {
	const toRecipient = (email: string) => ({ email });
	const attachments = await Promise.all(
		files.map(async (file) => ({
			filename: file.name,
			contentType: file.type || "application/octet-stream",
			content: Buffer.from(await file.arrayBuffer()),
			size: file.size,
		})),
	);

	try {
		await repo.sendMessage(grantId, {
			to: input.to.map(toRecipient),
			...(input.cc.length ? { cc: input.cc.map(toRecipient) } : {}),
			...(input.bcc.length ? { bcc: input.bcc.map(toRecipient) } : {}),
			subject: input.subject,
			body: renderOutgoingBody(input.body),
			...(attachments.length ? { attachments } : {}),
		});
	} catch {
		throw new AppError(
			EMAIL_ERROR.SEND_FAILED,
			"Couldn't send the message. Please try again.",
		);
	}
}
