import type { ComposeDraft } from "../../hooks/use-compose-draft";
import { ComposeFromField } from "./compose-from-field";
import { ComposeRecipientField } from "./compose-recipient-field";

/** The envelope section of the composer: From, To (with Cc/Bcc reveal
 *  toggles), the optional Cc/Bcc rows, and Subject. Pure layout over the
 *  draft state owned by `useComposeDraft`. */
export function ComposeEnvelopeFields({ draft }: { draft: ComposeDraft }) {
	return (
		<>
			<ComposeFromField
				fromAccountId={draft.fromAccountId}
				onChange={draft.setFromAccountId}
			/>
			<ComposeRecipientField
				label="To"
				recipients={draft.to}
				onChange={draft.setTo}
				autoFocus
				trailing={
					<span className="flex shrink-0 gap-1 text-muted-foreground text-xs">
						{!draft.showCc && (
							<button
								type="button"
								onClick={() => draft.setShowCc(true)}
								className="rounded px-1 py-0.5 transition-colors hover:bg-muted hover:text-foreground"
							>
								Cc
							</button>
						)}
						{!draft.showBcc && (
							<button
								type="button"
								onClick={() => draft.setShowBcc(true)}
								className="rounded px-1 py-0.5 transition-colors hover:bg-muted hover:text-foreground"
							>
								Bcc
							</button>
						)}
					</span>
				}
			/>
			{draft.showCc && (
				<ComposeRecipientField
					label="Cc"
					recipients={draft.cc}
					onChange={draft.setCc}
				/>
			)}
			{draft.showBcc && (
				<ComposeRecipientField
					label="Bcc"
					recipients={draft.bcc}
					onChange={draft.setBcc}
				/>
			)}

			<input
				type="text"
				aria-label="Subject"
				placeholder="Subject"
				value={draft.subject}
				onChange={(e) => draft.setSubject(e.target.value)}
				className="h-9 shrink-0 border-b bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground/60"
			/>
		</>
	);
}
