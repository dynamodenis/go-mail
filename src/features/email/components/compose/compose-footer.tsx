import { Button } from "@/components/ui/button";
import { Paperclip, Trash2 } from "lucide-react";
import { useRef } from "react";
import type { ComposeDraft } from "../../hooks/use-compose-draft";
import { ComposeIconButton } from "./compose-icon-button";

interface ComposeFooterProps {
	draft: ComposeDraft;
	onSend: () => void;
	onDiscard: () => void;
}

/** The composer's action bar: Send (with the platform-aware shortcut hint),
 *  the attachment picker (a hidden file input the paperclip triggers — picked
 *  Files go straight into the draft for the future FormData send), and
 *  discard. */
export function ComposeFooter({
	draft,
	onSend,
	onDiscard,
}: ComposeFooterProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const isMac =
		typeof navigator !== "undefined" && /Mac/.test(navigator.platform);

	return (
		<div className="flex shrink-0 items-center justify-between border-t px-3 py-2.5">
			<div className="flex items-center gap-1.5">
				<Button
					size="sm"
					disabled={!draft.canSend}
					onClick={onSend}
					className="gap-2 px-4"
				>
					Send
					<kbd className="rounded border border-primary-foreground/30 px-1 font-sans text-[10px] leading-4 opacity-80">
						{isMac ? "⌘↵" : "Ctrl ↵"}
					</kbd>
				</Button>
				<ComposeIconButton
					label="Attach files"
					onClick={() => fileInputRef.current?.click()}
				>
					<Paperclip className="size-4" />
				</ComposeIconButton>
				<input
					ref={fileInputRef}
					type="file"
					multiple
					hidden
					data-testid="compose-file-input"
					onChange={(e) => {
						if (e.target.files?.length) draft.addAttachments(e.target.files);
						// Same file can be re-picked after removal.
						e.target.value = "";
					}}
				/>
			</div>
			<ComposeIconButton
				label="Discard draft"
				onClick={onDiscard}
				className="hover:bg-destructive/15 hover:text-destructive"
			>
				<Trash2 className="size-4" />
			</ComposeIconButton>
		</div>
	);
}
