import type { Contact } from "@/features/contacts/schemas/types";
import { cn } from "@/lib/utils";

/** "Ada Lovelace", or the email's local part when the contact has no name. */
function displayName(contact: Contact): string {
	const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
	return name || contact.email.split("@")[0];
}

function initials(contact: Contact): string {
	if (contact.firstName && contact.lastName) {
		return `${contact.firstName[0]}${contact.lastName[0]}`.toUpperCase();
	}
	return (contact.firstName?.[0] ?? contact.email[0]).toUpperCase();
}

interface ComposeRecipientSuggestionsProps {
	/** DOM id of the listbox — referenced by the input's `aria-controls`. */
	id: string;
	suggestions: Contact[];
	activeIndex: number;
	/** Builds each option's DOM id, for `aria-activedescendant`. */
	optionId: (index: number) => string;
	onSelect: (email: string) => void;
	onHighlight: (index: number) => void;
}

/** Gmail-style contact suggestion list, anchored under a compose recipient
 *  row. Pure presentation — the owning field drives keyboard navigation via
 *  the combobox pattern (`aria-activedescendant` on its input), which is why
 *  options listen for mouse only and never take focus. */
export function ComposeRecipientSuggestions({
	id,
	suggestions,
	activeIndex,
	optionId,
	onSelect,
	onHighlight,
}: ComposeRecipientSuggestionsProps) {
	return (
		// biome-ignore lint/a11y/useFocusableInteractive: combobox popup — focus stays on the input, which references this list via aria-activedescendant.
		// biome-ignore lint/a11y/useSemanticElements: a <select> can't render rich rows or coexist with free-typed input; this is the ARIA combobox listbox pattern.
		<ul
			id={id}
			// biome-ignore lint/a11y/useSemanticElements: a <select> can't render rich rows or coexist with free-typed input; this is the ARIA combobox listbox pattern.
			// biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: same — listbox on <ul> is the canonical combobox popup.
			role="listbox"
			aria-label="Contact suggestions"
			className="fade-in-0 slide-in-from-top-1 absolute top-full right-0 left-0 z-20 mt-1 max-h-60 animate-in overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg"
		>
			{suggestions.map((contact, index) => (
				// biome-ignore lint/a11y/useFocusableInteractive: see listbox note above.
				// biome-ignore lint/a11y/useKeyWithClickEvents: keyboard selection happens on the combobox input (Enter on the highlighted option), per the ARIA pattern.
				<li
					key={contact.id}
					id={optionId(index)}
					// biome-ignore lint/a11y/useSemanticElements: see listbox note above.
					// biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: see listbox note above.
					role="option"
					aria-selected={index === activeIndex}
					// Prevent the mousedown from blurring the input — blur would
					// commit the half-typed text as a chip before the click lands.
					onMouseDown={(e) => e.preventDefault()}
					onClick={() => onSelect(contact.email)}
					onMouseEnter={() => onHighlight(index)}
					className={cn(
						"flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5",
						index === activeIndex && "bg-muted",
					)}
				>
					<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-xs">
						{initials(contact)}
					</span>
					<span className="min-w-0 flex-1">
						<span className="block truncate font-medium text-foreground text-sm">
							{displayName(contact)}
						</span>
						<span className="block truncate text-muted-foreground text-xs">
							{contact.email}
						</span>
					</span>
				</li>
			))}
		</ul>
	);
}
