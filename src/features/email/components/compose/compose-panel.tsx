import OrbiterBox from "@/components/global/orbiter-box";
import { cn } from "@/lib/utils";
import { GripVertical, Minus, X } from "lucide-react";
import type { CSSProperties, DragEvent, KeyboardEvent } from "react";
import { useCallback, useRef, useState } from "react";
import { useSendEmail } from "../../api/queries";
import { useEmailUIStore } from "../../api/store";
import { useComposeDraft } from "../../hooks/use-compose-draft";
import { useComposeResize } from "../../hooks/use-compose-resize";
import { EMAIL_PATTERN } from "../../utils/email-format";
import { ComposeAttachments } from "./compose-attachments";
import { ComposeEnvelopeFields } from "./compose-envelope-fields";
import { ComposeFooter } from "./compose-footer";
import { ComposeIconButton } from "./compose-icon-button";

const dragHasFiles = (e: DragEvent) => e.dataTransfer?.types.includes("Files");

/** Superhuman-style compose window: centered on md+ screens (resizable via
 *  its bottom-right grip), a full-width bottom sheet on mobile, and a docked
 *  bottom-right bar while minimized. Recipient chips with contact suggestions,
 *  a From selector, attachments (picker or drag-and-drop), ⌘/Ctrl+Enter to
 *  send, Esc to close. Opened via the sidebar Compose button, the mobile FAB,
 *  or the `C` shortcut — all drive `composeOpen` in the email UI store. */
export function ComposePanel() {
	const open = useEmailUIStore((s) => s.composeOpen);
	const minimized = useEmailUIStore((s) => s.composeMinimized);
	const closeCompose = useEmailUIStore((s) => s.closeCompose);
	const openCompose = useEmailUIStore((s) => s.openCompose);
	const toggleMinimized = useEmailUIStore((s) => s.toggleComposeMinimized);

	const draft = useComposeDraft();
	const { draftRef, reset: resetDraft, restore: restoreDraft } = draft;
	const resize = useComposeResize();
	const { mutate: sendMessage } = useSendEmail();

	// Drag-and-drop highlight; a depth counter because dragenter/dragleave fire
	// for every child the cursor crosses.
	const [dragActive, setDragActive] = useState(false);
	const dragDepth = useRef(0);

	// Guards double-⌘↵ in the same tick — state hasn't reset yet, so without
	// this the snapshot would send twice.
	const sendInFlight = useRef(false);

	// Superhuman-style send: the window closes instantly and the request runs
	// behind it. On failure the draft is restored and the composer reopens — a
	// written email must never be lost to a network blip (the global mutation
	// toast reports the error itself).
	const performSend = useCallback(() => {
		if (sendInFlight.current) return;
		const snapshot = draftRef.current;
		const recipients = [...snapshot.to, ...snapshot.cc, ...snapshot.bcc];
		if (!recipients.some((r) => EMAIL_PATTERN.test(r))) return;

		sendInFlight.current = true;
		resetDraft();
		closeCompose();
		sendMessage(snapshot, {
			onError: () => {
				restoreDraft(snapshot);
				openCompose();
			},
			onSettled: () => {
				sendInFlight.current = false;
			},
		});
	}, [
		draftRef,
		resetDraft,
		restoreDraft,
		closeCompose,
		openCompose,
		sendMessage,
	]);

	if (!open) return null;

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

	const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
		if (!dragHasFiles(e) || minimized) return;
		e.preventDefault();
		dragDepth.current += 1;
		setDragActive(true);
	};

	const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
		if (!dragHasFiles(e)) return;
		dragDepth.current = Math.max(0, dragDepth.current - 1);
		if (dragDepth.current === 0) setDragActive(false);
	};

	const handleDrop = (e: DragEvent<HTMLDivElement>) => {
		if (!dragHasFiles(e)) return;
		e.preventDefault();
		dragDepth.current = 0;
		setDragActive(false);
		if (!minimized) draft.addAttachments(e.dataTransfer.files);
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
				onDragEnter={handleDragEnter}
				onDragOver={(e) => dragHasFiles(e) && e.preventDefault()}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				style={
					{
						"--compose-w": `${resize.size.width}px`,
						"--compose-h": `${resize.size.height}px`,
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
									{draft.subject.trim() || "New message"}
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
									<ComposeEnvelopeFields draft={draft} />

									{/* Fills whatever height the user drags the window to. */}
									<textarea
										aria-label="Message body"
										placeholder="Write your message…"
										value={draft.body}
										onChange={(e) => draft.setBody(e.target.value)}
										className="min-h-40 w-full flex-1 resize-none bg-transparent px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/60"
									/>
								</div>

								<ComposeAttachments
									files={draft.attachments}
									error={draft.attachmentError}
									onRemove={draft.removeAttachment}
								/>

								<ComposeFooter
									draft={draft}
									onSend={performSend}
									onDiscard={() => {
										resetDraft();
										closeCompose();
									}}
								/>
							</>
						)}
					</div>
				</OrbiterBox>

				{/* Drop-target highlight while files are dragged over the window. */}
				{dragActive && !minimized && (
					<div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-xl border-2 border-primary border-dashed bg-primary/5">
						<span className="rounded-md bg-card px-3 py-1.5 font-medium text-sm shadow-sm">
							Drop files to attach
						</span>
					</div>
				)}

				{/* Resize grip — drag (or focus + arrow keys) to grow/shrink the
				    window. Desktop only; the mobile sheet is always full-width. */}
				{!minimized && (
					<button
						type="button"
						aria-label="Resize composer (drag or arrow keys)"
						title="Drag to resize"
						onPointerDown={resize.startResize}
						onPointerMove={resize.moveResize}
						onPointerUp={resize.endResize}
						onPointerCancel={resize.endResize}
						onKeyDown={resize.resizeByKey}
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
