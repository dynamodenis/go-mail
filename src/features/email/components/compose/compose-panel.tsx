import OrbiterBox from "@/components/global/orbiter-box";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Minus, Paperclip, Trash2, X } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { useEmailUIStore } from "../../api/store";
import {
	ComposeRecipientField,
	EMAIL_PATTERN,
} from "./compose-recipient-field";

/** Small icon button used in the compose header and footer. */
function ComposeIconButton({
	label,
	onClick,
	children,
	className,
}: {
	label: string;
	onClick?: () => void;
	children: ReactNode;
	className?: string;
}) {
	return (
		<button
			type="button"
			aria-label={label}
			title={label}
			onClick={onClick}
			className={cn(
				"flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
				className,
			)}
		>
			{children}
		</button>
	);
}

/** Gmail-style compose window, docked to the bottom-right of the mail view:
 *  minimizable from its header, recipient chips with Cc/Bcc, and ⌘/Ctrl+Enter
 *  to send. Opened from the sidebar Compose button or the `C` shortcut (both
 *  drive `composeOpen` in the email UI store); Esc closes it. */
export function ComposePanel() {
	const open = useEmailUIStore((s) => s.composeOpen);
	const minimized = useEmailUIStore((s) => s.composeMinimized);
	const closeCompose = useEmailUIStore((s) => s.closeCompose);
	const toggleMinimized = useEmailUIStore((s) => s.toggleComposeMinimized);

	const [to, setTo] = useState<string[]>([]);
	const [cc, setCc] = useState<string[]>([]);
	const [bcc, setBcc] = useState<string[]>([]);
	const [showCc, setShowCc] = useState(false);
	const [showBcc, setShowBcc] = useState(false);
	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");

	// ⌘↵ from a recipient input commits the typed address in the same keystroke;
	// that state lands after this render, so send reads the draft through a ref
	// (refreshed every render) one tick later instead of a stale closure.
	const draftRef = useRef({ to, cc, bcc, subject, body });
	draftRef.current = { to, cc, bcc, subject, body };

	const resetDraft = useCallback(() => {
		setTo([]);
		setCc([]);
		setBcc([]);
		setShowCc(false);
		setShowBcc(false);
		setSubject("");
		setBody("");
	}, []);

	// Stubbed for now — the Nylas send mutation isn't wired up yet. Sending
	// clears the draft and closes the window so the interaction flow is complete.
	const performSend = useCallback(() => {
		const draft = draftRef.current;
		const recipients = [...draft.to, ...draft.cc, ...draft.bcc];
		if (!recipients.some((r) => EMAIL_PATTERN.test(r))) return;
		resetDraft();
		closeCompose();
	}, [resetDraft, closeCompose]);

	if (!open) return null;

	const canSend = [...to, ...cc, ...bcc].some((r) => EMAIL_PATTERN.test(r));
	const isMac =
		typeof navigator !== "undefined" && /Mac/.test(navigator.platform);

	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key === "Escape") {
			e.stopPropagation();
			closeCompose();
		} else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			// Next tick: lets a recipient field's own commit-on-⌘↵ flush first.
			setTimeout(performSend, 0);
		}
	};

	return (
		<div
			// biome-ignore lint/a11y/useSemanticElements: a native <dialog> carries modal semantics and UA styles that don't fit this docked, non-modal composer.
			role="dialog"
			aria-label="New message"
			onKeyDown={handleKeyDown}
			className={cn(
				"fade-in slide-in-from-bottom-8 fixed right-6 bottom-0 z-50 hidden max-w-[calc(100vw-3rem)] animate-in rounded-t-xl shadow-2xl shadow-primary/10 duration-300 md:block",
				minimized ? "w-72" : "w-[520px]",
			)}
		>
			<OrbiterBox
				variant="blue-light-horizontal"
				borderRadiusTopLeft={12}
				borderRadiusTopRight={12}
			>
				<div className="flex flex-col rounded-t-xl bg-card">
					{/* Header — clicking the title bar toggles minimize, like Gmail. */}
					<div className="flex h-10 shrink-0 items-center gap-1 rounded-t-xl border-b px-2">
						<button
							type="button"
							onClick={toggleMinimized}
							aria-expanded={!minimized}
							className="flex h-full min-w-0 flex-1 items-center px-2 text-left"
						>
							<span className="truncate font-medium text-sm">
								{subject.trim() || "New message"}
							</span>
						</button>
						<ComposeIconButton
							label={minimized ? "Expand" : "Minimize"}
							onClick={toggleMinimized}
						>
							<Minus className="size-3.5" />
						</ComposeIconButton>
						<ComposeIconButton label="Close" onClick={closeCompose}>
							<X className="size-3.5" />
						</ComposeIconButton>
					</div>

					{!minimized && (
						<>
							<ComposeRecipientField
								label="To"
								recipients={to}
								onChange={setTo}
								autoFocus
								trailing={
									<span className="flex shrink-0 gap-1 text-muted-foreground text-xs">
										{!showCc && (
											<button
												type="button"
												onClick={() => setShowCc(true)}
												className="rounded px-1 py-0.5 transition-colors hover:bg-muted hover:text-foreground"
											>
												Cc
											</button>
										)}
										{!showBcc && (
											<button
												type="button"
												onClick={() => setShowBcc(true)}
												className="rounded px-1 py-0.5 transition-colors hover:bg-muted hover:text-foreground"
											>
												Bcc
											</button>
										)}
									</span>
								}
							/>
							{showCc && (
								<ComposeRecipientField
									label="Cc"
									recipients={cc}
									onChange={setCc}
								/>
							)}
							{showBcc && (
								<ComposeRecipientField
									label="Bcc"
									recipients={bcc}
									onChange={setBcc}
								/>
							)}

							<input
								type="text"
								aria-label="Subject"
								placeholder="Subject"
								value={subject}
								onChange={(e) => setSubject(e.target.value)}
								className="h-9 shrink-0 border-b bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground/60"
							/>

							<TextareaAutosize
								aria-label="Message body"
								placeholder="Write your message…"
								value={body}
								onChange={(e) => setBody(e.target.value)}
								minRows={9}
								maxRows={16}
								className="w-full resize-none bg-transparent px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/60"
							/>

							<div className="flex shrink-0 items-center justify-between border-t px-3 py-2.5">
								<div className="flex items-center gap-1.5">
									<Button
										size="sm"
										disabled={!canSend}
										onClick={performSend}
										className="gap-2 px-4"
									>
										Send
										<kbd className="rounded border border-primary-foreground/30 px-1 font-sans text-[10px] leading-4 opacity-80">
											{isMac ? "⌘↵" : "Ctrl ↵"}
										</kbd>
									</Button>
									{/* Stubbed for now — attachment upload lands with the send
									    mutation. */}
									<ComposeIconButton label="Attach files">
										<Paperclip className="size-4" />
									</ComposeIconButton>
								</div>
								<ComposeIconButton
									label="Discard draft"
									onClick={() => {
										resetDraft();
										closeCompose();
									}}
									className="hover:bg-destructive/15 hover:text-destructive"
								>
									<Trash2 className="size-4" />
								</ComposeIconButton>
							</div>
						</>
					)}
				</div>
			</OrbiterBox>
		</div>
	);
}
