import OrbiterBox from "@/components/global/orbiter-box";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GripVertical, Minus, Paperclip, Trash2, X } from "lucide-react";
import type {
	CSSProperties,
	KeyboardEvent,
	ReactNode,
	PointerEvent as ReactPointerEvent,
} from "react";
import { useCallback, useRef, useState } from "react";
import { useEmailUIStore } from "../../api/store";
import {
	ComposeRecipientField,
	EMAIL_PATTERN,
} from "./compose-recipient-field";

const COMPOSE_DEFAULT_SIZE = { width: 680, height: 560 };
const COMPOSE_MIN_SIZE = { width: 480, height: 400 };
/** Pixels added/removed per arrow-key press on the resize handle. */
const COMPOSE_RESIZE_STEP = 32;

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

/** Superhuman-style compose window: centered on md+ screens (resizable by
 *  dragging its bottom-right grip or with arrow keys on the focused grip),
 *  a full-width bottom sheet on mobile, and a small docked bottom-right bar
 *  while minimized. Recipient chips with Cc/Bcc, ⌘/Ctrl+Enter to send, Esc to
 *  close. Opened via the sidebar Compose button, the mobile FAB, or the `C`
 *  shortcut — all drive `composeOpen` in the email UI store. */
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

	// User-chosen window size (md+ only — mobile is always a full-width sheet).
	// Survives close/reopen since the panel stays mounted in EmailView.
	const [size, setSize] = useState(COMPOSE_DEFAULT_SIZE);
	const resizeOrigin = useRef<{
		x: number;
		y: number;
		width: number;
		height: number;
	} | null>(null);

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

	const clampSize = (width: number, height: number) => ({
		// Upper bounds live in CSS (`min(…, calc(100vw/dvh - …))`) so the window
		// can never outgrow the viewport; only the floor is enforced here.
		width: Math.max(COMPOSE_MIN_SIZE.width, width),
		height: Math.max(COMPOSE_MIN_SIZE.height, height),
	});

	const startResize = (e: ReactPointerEvent<HTMLButtonElement>) => {
		e.currentTarget.setPointerCapture(e.pointerId);
		resizeOrigin.current = { x: e.clientX, y: e.clientY, ...size };
	};

	const moveResize = (e: ReactPointerEvent<HTMLButtonElement>) => {
		const origin = resizeOrigin.current;
		if (!origin) return;
		// The window stays centered, so each dragged pixel grows both sides —
		// doubling the delta keeps the grabbed corner tracking the cursor.
		setSize(
			clampSize(
				origin.width + (e.clientX - origin.x) * 2,
				origin.height + (e.clientY - origin.y) * 2,
			),
		);
	};

	const endResize = () => {
		resizeOrigin.current = null;
	};

	const resizeByKey = (e: KeyboardEvent<HTMLButtonElement>) => {
		const deltas: Record<string, [number, number]> = {
			ArrowLeft: [-COMPOSE_RESIZE_STEP, 0],
			ArrowRight: [COMPOSE_RESIZE_STEP, 0],
			ArrowUp: [0, -COMPOSE_RESIZE_STEP],
			ArrowDown: [0, COMPOSE_RESIZE_STEP],
		};
		const delta = deltas[e.key];
		if (!delta) return;
		e.preventDefault();
		setSize((s) => clampSize(s.width + delta[0], s.height + delta[1]));
	};

	return (
		// Full-screen positioning layer: pointer-events pass through it so the
		// mailbox behind stays interactive (the composer is non-modal).
		<div
			className={cn(
				"pointer-events-none fixed inset-0 z-50 flex items-end justify-center p-2 md:p-4",
				minimized
					? "md:items-end md:justify-end"
					: "md:items-center md:justify-center",
			)}
		>
			<div
				// biome-ignore lint/a11y/useSemanticElements: a native <dialog> carries modal semantics and UA styles that don't fit this non-modal composer.
				role="dialog"
				aria-label="New message"
				onKeyDown={handleKeyDown}
				style={
					{
						"--compose-w": `${size.width}px`,
						"--compose-h": `${size.height}px`,
					} as CSSProperties
				}
				className={cn(
					"fade-in slide-in-from-bottom-8 pointer-events-auto relative w-full animate-in rounded-xl shadow-2xl shadow-primary/10 duration-300",
					minimized
						? "md:w-72"
						: "h-[70dvh] md:h-[min(var(--compose-h),calc(100dvh-4rem))] md:w-[min(var(--compose-w),calc(100vw-4rem))]",
				)}
			>
				<OrbiterBox
					variant="blue-light-horizontal"
					borderRadius={12}
					className="h-full"
				>
					<div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[inherit] bg-card">
						{/* Header — clicking the title bar toggles minimize, like Gmail. */}
						<div className="flex h-10 shrink-0 items-center gap-1 border-b px-2">
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
								{/* Fields + body scroll together if the window is dragged
								    smaller than its content. */}
								<div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
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

									{/* Fills whatever height the user drags the window to. */}
									<textarea
										aria-label="Message body"
										placeholder="Write your message…"
										value={body}
										onChange={(e) => setBody(e.target.value)}
										className="min-h-40 w-full flex-1 resize-none bg-transparent px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/60"
									/>
								</div>

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

				{/* Resize grip — drag (or focus + arrow keys) to grow/shrink the
				    window. Desktop only; the mobile sheet is always full-width. */}
				{!minimized && (
					<button
						type="button"
						aria-label="Resize composer (drag or arrow keys)"
						title="Drag to resize"
						onPointerDown={startResize}
						onPointerMove={moveResize}
						onPointerUp={endResize}
						onPointerCancel={endResize}
						onKeyDown={resizeByKey}
						className="absolute right-0 bottom-0 z-10 hidden size-5 cursor-nwse-resize touch-none items-center justify-center rounded-br-xl text-muted-foreground/40 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex"
					>
						{/* Rotated 45° so the grip reads as a diagonal corner handle. */}
						<GripVertical aria-hidden="true" className="size-3.5 rotate-45" />
					</button>
				)}
			</div>
		</div>
	);
}
