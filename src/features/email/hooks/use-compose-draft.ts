import { useCallback, useRef, useState } from "react";
import { EMAIL_PATTERN } from "../utils/email-format";

/** Nylas caps multipart send requests at 25 MB total (the plain-JSON path is
 *  smaller still, ~3 MB, but the Node SDK switches to multipart automatically
 *  once attachments push past that). The client enforces this ceiling for
 *  instant feedback; the send server function re-checks it — never trust the
 *  client. */
export const MAX_ATTACHMENT_TOTAL_BYTES = 25 * 1024 * 1024;

export interface ComposeDraftValues {
	to: string[];
	cc: string[];
	bcc: string[];
	subject: string;
	body: string;
	fromAccountId: string | null;
	attachments: File[];
}

/** All state for one in-progress message in the compose window: envelope
 *  fields, body, the sending account, and attachments (kept as File objects so
 *  the send mutation can lift them straight into FormData — no base64 detour).
 *
 *  `draftRef` mirrors the latest values every render: ⌘↵ from a recipient
 *  input commits the typed address in the same keystroke, and that state lands
 *  after the render that scheduled the send — so send must read through the
 *  ref one tick later, not through a stale closure. */
export function useComposeDraft() {
	const [to, setTo] = useState<string[]>([]);
	const [cc, setCc] = useState<string[]>([]);
	const [bcc, setBcc] = useState<string[]>([]);
	const [showCc, setShowCc] = useState(false);
	const [showBcc, setShowBcc] = useState(false);
	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");
	// Which connected mailbox to send from; null = the primary account. Only an
	// account id ever lives client-side — the send server function resolves it
	// to a grant after verifying ownership.
	const [fromAccountId, setFromAccountId] = useState<string | null>(null);
	const [attachments, setAttachments] = useState<File[]>([]);
	const [attachmentError, setAttachmentError] = useState<string | null>(null);

	const draftRef = useRef<ComposeDraftValues>({
		to,
		cc,
		bcc,
		subject,
		body,
		fromAccountId,
		attachments,
	});
	draftRef.current = { to, cc, bcc, subject, body, fromAccountId, attachments };

	/** Adds picked/dropped files, skipping duplicates (same name + size) and
	 *  anything that would push the total past the Nylas cap — rejections
	 *  surface through `attachmentError`. */
	const addAttachments = useCallback(
		(incoming: Iterable<File>) => {
			const accepted: File[] = [];
			let total = attachments.reduce((sum, f) => sum + f.size, 0);
			let rejectedForSize = false;

			for (const file of incoming) {
				const duplicate = [...attachments, ...accepted].some(
					(f) => f.name === file.name && f.size === file.size,
				);
				if (duplicate) continue;
				if (total + file.size > MAX_ATTACHMENT_TOTAL_BYTES) {
					rejectedForSize = true;
					continue;
				}
				total += file.size;
				accepted.push(file);
			}

			if (accepted.length)
				setAttachments((current) => [...current, ...accepted]);
			setAttachmentError(
				rejectedForSize ? "Attachments are limited to 25 MB in total." : null,
			);
		},
		[attachments],
	);

	const removeAttachment = useCallback((index: number) => {
		setAttachments((current) => current.filter((_, i) => i !== index));
		setAttachmentError(null);
	}, []);

	const reset = useCallback(() => {
		setTo([]);
		setCc([]);
		setBcc([]);
		setShowCc(false);
		setShowBcc(false);
		setSubject("");
		setBody("");
		setFromAccountId(null);
		setAttachments([]);
		setAttachmentError(null);
	}, []);

	const canSend = [...to, ...cc, ...bcc].some((r) => EMAIL_PATTERN.test(r));

	return {
		to,
		setTo,
		cc,
		setCc,
		bcc,
		setBcc,
		showCc,
		setShowCc,
		showBcc,
		setShowBcc,
		subject,
		setSubject,
		body,
		setBody,
		fromAccountId,
		setFromAccountId,
		attachments,
		attachmentError,
		addAttachments,
		removeAttachment,
		draftRef,
		reset,
		canSend,
	};
}

export type ComposeDraft = ReturnType<typeof useComposeDraft>;
