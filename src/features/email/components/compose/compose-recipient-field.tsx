import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { useState } from "react";
import { useRecipientSuggestions } from "../../api/queries";
import { ComposeRecipientSuggestions } from "./compose-recipient-suggestions";

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

/** One recipient row of the compose window, behaving as a combobox: typing
 *  surfaces matching contacts (arrow keys + Enter or click to accept), while
 *  free-typed addresses still commit to chips on Enter, comma or blur — the
 *  suggestions augment the field, they never gate it. Pasted lists split on
 *  commas/semicolons/whitespace; Backspace in an empty input pops the last
 *  chip; chips that aren't valid email addresses render in the destructive
 *  style so mistakes are visible before send. */
export function ComposeRecipientField({
	label,
	recipients,
	onChange,
	autoFocus,
	trailing,
}: ComposeRecipientFieldProps) {
	const [draft, setDraft] = useState("");
	const [listOpen, setListOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(0);

	const inputId = `compose-${label.toLowerCase()}`;
	const listId = `${inputId}-suggestions`;
	const optionId = (index: number) => `${inputId}-option-${index}`;

	const { data: contacts } = useRecipientSuggestions(draft);
	// Someone already chipped shouldn't be suggested again.
	const suggestions = (contacts ?? []).filter(
		(c) => !recipients.includes(c.email),
	);
	const showList =
		listOpen && draft.trim().length > 0 && suggestions.length > 0;

	const commitDraft = (value: string) => {
		const entries = value
			.split(/[,;\s]+/)
			.map((entry) => entry.trim())
			.filter(Boolean)
			.filter((entry) => !recipients.includes(entry));
		if (entries.length) onChange([...recipients, ...entries]);
		setDraft("");
		setListOpen(false);
	};

	const selectSuggestion = (email: string) => {
		onChange([...recipients, email]);
		setDraft("");
		setListOpen(false);
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (showList && e.key === "ArrowDown") {
			e.preventDefault();
			setActiveIndex((i) => (i + 1) % suggestions.length);
		} else if (showList && e.key === "ArrowUp") {
			e.preventDefault();
			setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
		} else if (e.key === "Escape" && showList) {
			// Dismiss only the suggestions — the composer's own Escape handler
			// (close window) must not see this one.
			e.stopPropagation();
			setListOpen(false);
		} else if (e.key === "Enter" || e.key === ",") {
			const plainEnter = e.key === "Enter" && !e.metaKey && !e.ctrlKey;
			if (plainEnter && showList && suggestions[activeIndex]) {
				e.preventDefault();
				selectSuggestion(suggestions[activeIndex].email);
			} else if (draft.trim()) {
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
		<div className="relative flex min-h-9 shrink-0 items-center gap-2 border-b px-4 py-1.5">
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
					role="combobox"
					aria-label={`${label} recipients`}
					aria-expanded={showList}
					aria-controls={listId}
					aria-autocomplete="list"
					aria-activedescendant={showList ? optionId(activeIndex) : undefined}
					// biome-ignore lint/a11y/noAutofocus: focusing the To field on open is the expected compose behavior.
					autoFocus={autoFocus}
					value={draft}
					onChange={(e) => {
						setDraft(e.target.value);
						setListOpen(true);
						setActiveIndex(0);
					}}
					onKeyDown={handleKeyDown}
					onBlur={() => {
						if (draft.trim()) commitDraft(draft);
						else setListOpen(false);
					}}
					autoComplete="off"
					spellCheck={false}
					className="h-6 min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
				/>
			</div>
			{trailing}

			{showList && (
				<ComposeRecipientSuggestions
					id={listId}
					suggestions={suggestions}
					activeIndex={activeIndex}
					optionId={optionId}
					onSelect={selectSuggestion}
					onHighlight={setActiveIndex}
				/>
			)}
		</div>
	);
}
