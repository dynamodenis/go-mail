import { Paperclip, X } from "lucide-react";
import { formatFileSize } from "../../utils/email-format";

interface ComposeAttachmentsProps {
	files: File[];
	/** Rejection message from the draft's size/dedupe gate, if any. */
	error: string | null;
	onRemove: (index: number) => void;
}

/** Attachment chips pinned above the composer footer — file name, size, and a
 *  remove control per file. Renders nothing while there's nothing to show. */
export function ComposeAttachments({
	files,
	error,
	onRemove,
}: ComposeAttachmentsProps) {
	if (!files.length && !error) return null;

	return (
		<div className="shrink-0 border-t px-3 py-2">
			{files.length > 0 && (
				<ul className="flex flex-wrap gap-1.5">
					{files.map((file, index) => (
						<li
							key={`${file.name}-${file.size}`}
							className="inline-flex max-w-full items-center gap-1.5 rounded-md border bg-muted/40 py-1 pr-1 pl-2 text-xs"
						>
							<Paperclip className="size-3 shrink-0 text-muted-foreground" />
							<span className="max-w-[180px] truncate">{file.name}</span>
							<span className="shrink-0 text-muted-foreground">
								{formatFileSize(file.size)}
							</span>
							<button
								type="button"
								aria-label={`Remove attachment ${file.name}`}
								onClick={() => onRemove(index)}
								className="flex size-4 shrink-0 items-center justify-center rounded transition-colors hover:bg-muted-foreground/20"
							>
								<X className="size-3" />
							</button>
						</li>
					))}
				</ul>
			)}
			{error && (
				<p role="alert" className="mt-1 text-destructive text-xs">
					{error}
				</p>
			)}
		</div>
	);
}
