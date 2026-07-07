import { z } from "zod";

/** The kinds of mailbox folder the UI understands. System roles get a friendly
 *  name + icon and a fixed sort position; everything else (the user's own
 *  folders/labels) is "custom". Drives display, ordering, and the
 *  sender-vs-recipient preview rule. */
export const FOLDER_ROLES = [
	"inbox",
	"starred",
	"snoozed",
	"sent",
	"drafts",
	"important",
	"unread",
	"scheduled",
	"chats",
	"archive",
	"spam",
	"trash",
	"custom",
] as const;
export const folderRoleSchema = z.enum(FOLDER_ROLES);
export type FolderRole = z.infer<typeof folderRoleSchema>;

/** Maps the IMAP special-use attribute Nylas tags a system folder with onto our
 *  role. Resolving by attribute (not name) keeps detection working across
 *  Gmail/Microsoft/iCloud, which name their system folders differently. */
export const ATTRIBUTE_ROLE: Record<string, FolderRole> = {
	"\\Inbox": "inbox",
	"\\Sent": "sent",
	"\\Drafts": "drafts",
	"\\Junk": "spam",
	"\\Trash": "trash",
	"\\Archive": "archive",
	"\\All": "archive",
	"\\Important": "important",
	"\\Flagged": "starred",
};

/** Friendly, provider-agnostic labels for system roles, so a Gmail "[Gmail]/All
 *  Mail" and an Outlook "Archive" both read the same in the sidebar. The archive
 *  role is surfaced as "Done" (Superhuman-style) — marking a thread done just
 *  archives it on the provider. */
export const ROLE_LABEL: Record<Exclude<FolderRole, "custom">, string> = {
	inbox: "Inbox",
	starred: "Starred",
	snoozed: "Snoozed",
	sent: "Sent",
	drafts: "Drafts",
	important: "Important",
	unread: "Unread",
	scheduled: "Scheduled",
	chats: "Chats",
	archive: "Done",
	spam: "Spam",
	trash: "Trash",
};

/** Order of system folders in the sidebar — a deliberate, Gmail-like sequence
 *  (NOT alphabetical), except Done (archive) sits right under Inbox because it's
 *  the primary triage destination. Custom labels sort after all system folders,
 *  by name. */
export const SYSTEM_ROLE_ORDER: Record<FolderRole, number> = {
	inbox: 0,
	archive: 1,
	starred: 2,
	snoozed: 3,
	sent: 4,
	drafts: 5,
	important: 6,
	unread: 7,
	spam: 8,
	trash: 9,
	scheduled: 10,
	chats: 11,
	custom: 99,
};

/** Friendly display names for Gmail's internal category labels, which Nylas
 *  returns with raw, shouty names (e.g. "CATEGORY_PROMOTIONS"). Keyed by the raw
 *  name, upper-cased. Unknown names keep the provider's name. */
export const FOLDER_NAME_OVERRIDES: Record<string, string> = {
	CATEGORY_PERSONAL: "Personal",
	CATEGORY_SOCIAL: "Social",
	CATEGORY_PROMOTIONS: "Promotions",
	CATEGORY_UPDATES: "Updates",
	CATEGORY_FORUMS: "Forums",
};

/** System roles pinned to the top of the sidebar, always visible (ordered by
 *  SYSTEM_ROLE_ORDER). Every other system folder lives under the collapsible
 *  "More"; the user's own labels get their own "Labels" section. */
export const PRIMARY_FOLDER_ROLES: ReadonlySet<FolderRole> = new Set([
	"inbox",
	"archive", // shown as "Done" — where archived (done) threads land
	"starred",
	"snoozed",
	"sent",
	"drafts",
	"important",
	"unread",
	"spam",
	"trash",
]);

/** Separator Gmail (and most IMAP providers) use to express nested labels, e.g.
 *  "[Orbiter.io]/Done". The Labels section builds a tree from these. */
export const LABEL_PATH_SEPARATOR = "/";

/** Error codes the email feature throws/returns. NOT_CONNECTED and
 *  NOT_CONFIGURED are expected states the UI turns into a connect CTA rather
 *  than a generic error. */
export const EMAIL_ERROR = {
	NOT_CONFIGURED: "NYLAS_NOT_CONFIGURED",
	NOT_CONNECTED: "NYLAS_NOT_CONNECTED",
	FETCH_FAILED: "EMAIL_FETCH_FAILED",
	UPDATE_FAILED: "EMAIL_UPDATE_FAILED",
} as const;

/** Codes that represent "no mailbox to read", surfaced as a CTA, not an error. */
export const EMAIL_CONNECT_CODES: ReadonlySet<string> = new Set([
	EMAIL_ERROR.NOT_CONFIGURED,
	EMAIL_ERROR.NOT_CONNECTED,
]);

export const emailThreadsQuerySchema = z.object({
	folderId: z.string().min(1),
	/** Role is derived from the folder client-side and passed through so the
	 *  service can apply the sender-vs-recipient preview rule. Defaults to
	 *  "custom" (sender preview) when the folder hasn't been classified yet. */
	role: folderRoleSchema.default("custom"),
	search: z.string().trim().max(255).optional(),
});
export type EmailThreadsQuery = z.infer<typeof emailThreadsQuerySchema>;

export const emailThreadDetailQuerySchema = z.object({
	threadId: z.string().min(1),
});
export type EmailThreadDetailQuery = z.infer<
	typeof emailThreadDetailQuerySchema
>;

export const archiveThreadSchema = z.object({
	threadId: z.string().min(1),
});
export type ArchiveThreadInput = z.infer<typeof archiveThreadSchema>;

export const sendEmailSchema = z.object({
	to: z.array(z.string().email()).min(1, "At least one recipient is required"),
	cc: z.array(z.string().email()).optional(),
	bcc: z.array(z.string().email()).optional(),
	subject: z.string().min(1, "Subject is required").max(255),
	body: z.string().min(1, "Email body is required"),
	replyToMessageId: z.string().optional(),
});
export type SendEmailInput = z.infer<typeof sendEmailSchema>;

export const saveDraftSchema = z.object({
	to: z.array(z.string().email()).optional(),
	cc: z.array(z.string().email()).optional(),
	bcc: z.array(z.string().email()).optional(),
	subject: z.string().max(255).optional(),
	body: z.string().optional(),
	draftId: z.string().optional(),
});
export type SaveDraftInput = z.infer<typeof saveDraftSchema>;

export interface EmailMessage {
	id: string;
	threadId: string;
	from: EmailParticipant;
	to: EmailParticipant[];
	cc: EmailParticipant[];
	bcc: EmailParticipant[];
	subject: string;
	body: string;
	snippet: string;
	isRead: boolean;
	starred: boolean;
	date: string;
	folders: string[];
	attachments: EmailAttachment[];
}

export interface EmailParticipant {
	name: string | null;
	email: string;
}

export interface EmailAttachment {
	id: string;
	filename: string;
	contentType: string;
	size: number;
}

// ── Inbox UI shapes (Superhuman-style list + reading pane) ──────────────────
// Provider-agnostic shapes the inbox UI renders, so the Nylas integration can
// map its payloads onto them without the components knowing about Nylas.

/** A mailbox folder for the sidebar — already classified and named by the
 *  service. `system` separates provider system folders (Inbox, Sent, Spam, …)
 *  from the user's own labels, which render in their own section. For labels,
 *  `name` keeps the full provider path (e.g. "[Orbiter.io]/Done") so the sidebar
 *  can build a nested tree; for system folders it's the friendly display name. */
export interface EmailFolderItem {
	id: string;
	name: string;
	role: FolderRole;
	system: boolean;
	unreadCount: number;
}

/** A condensed thread for the list pane. */
export interface EmailThread {
	id: string;
	subject: string;
	snippet: string;
	unread: boolean;
	starred: boolean;
	hasAttachments: boolean;
	/** Participants shown as the avatar stack in the reading pane. */
	participants: EmailParticipant[];
	/** Name/email shown in the list row — latest sender, or the recipient for
	 *  the sent/drafts folders. */
	preview: EmailParticipant;
	date: string; // ISO
	messageCount: number;
}

/** A single message within an opened thread (reading pane). */
export interface EmailThreadMessage {
	id: string;
	from: EmailParticipant;
	to: EmailParticipant[];
	cc?: EmailParticipant[];
	subject: string;
	/** Skeleton renders this as plain text; once Nylas is wired this becomes
	 *  sanitized HTML (CLAUDE.md security rules — sanitize before render). */
	body: string;
	snippet: string;
	date: string; // ISO
	unread: boolean;
}

/** The fully-expanded thread for the reading pane. */
export interface EmailThreadDetail {
	id: string;
	subject: string;
	participants: EmailParticipant[];
	messages: EmailThreadMessage[];
}
