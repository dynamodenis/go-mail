import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { useState } from "react";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ComposeRecipientFieldProps {
	/** Row label — "To", "Cc" or "Bcc". Doubles as the input's accessible name. */
	label: string;
	recipients: string[];
	onChange: (next: string[]) => void;
	autoFocus?: boolean;
	/** Extra controls rendered at the end of the row (e.g. Cc/Bcc toggles). */
	trailing?: ReactNode;
}

/** One recipient row of the compose window. Typed addresses commit to chips on
 *  Enter, comma or blur (pasted lists split on commas/semicolons/whitespace);
 *  Backspace in an empty input pops the last chip. Chips that aren't valid
 *  email addresses render in the destructive style so mistakes are visible
 *  before send. */
export function ComposeRecipientField({
	label,
	recipients,
	onChange,
	autoFocus,
	trailing,
}: ComposeRecipientFieldProps) {
	const [draft, setDraft] = useState("");
	const inputId = `compose-${label.toLowerCase()}`;

	const commitDraft = (value: string) => {
		const entries = value
			.split(/[,;\s]+/)
			.map((entry) => entry.trim())
			.filter(Boolean)
			.filter((entry) => !recipients.includes(entry));
		if (entries.length) onChange([...recipients, ...entries]);
		setDraft("");
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" || e.key === ",") {
			if (draft.trim()) {
				e.preventDefault();
				// Note: a Cmd/Ctrl+Enter still bubbles to the panel's send handler
				// after this commit, so "type address, hit ⌘↵" sends in one stroke.
				commitDraft(draft);
			}
		} else if (e.key === "Backspace" && !draft && recipients.length) {
			onChange(recipients.slice(0, -1));
		}
	};

	return (
		<div className="flex min-h-9 items-center gap-2 border-b px-4 py-1.5">
			<label
				htmlFor={inputId}
				className="w-7 shrink-0 cursor-text text-muted-foreground text-sm"
			>
				{label}
			</label>
			<div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
				{recipients.map((email) => {
					const valid = EMAIL_PATTERN.test(email);
					return (
						<span
							key={email}
							className={cn(
								"inline-flex max-w-full items-center gap-0.5 rounded-full border py-0.5 pr-1 pl-2.5 text-xs",
								valid
									? "border-border bg-muted/60 text-foreground"
									: "border-destructive/40 bg-destructive/10 text-destructive",
							)}
						>
							<span className="truncate">{email}</span>
							<button
								type="button"
								aria-label={`Remove ${email}`}
								onClick={() => onChange(recipients.filter((r) => r !== email))}
								className="flex size-4 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-muted-foreground/20"
							>
								<X className="size-3" />
							</button>
						</span>
					);
				})}
				<input
					id={inputId}
					type="text"
					aria-label={`${label} recipients`}
					// biome-ignore lint/a11y/noAutofocus: focusing the To field on open is the expected compose behavior.
					autoFocus={autoFocus}
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={() => draft.trim() && commitDraft(draft)}
					autoComplete="off"
					spellCheck={false}
					className="h-6 min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
				/>
			</div>
			{trailing}
		</div>
	);
}
