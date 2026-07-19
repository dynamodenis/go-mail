import { cn } from "@/lib/utils";
import { SquarePen } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { useEmailUIStore } from "../../api/store";

/** Gmail-style primary Compose action, pinned at the top of the email sidebar.
 *  Superhuman touch: the global `C` shortcut opens a new message from anywhere
 *  in the mail view (react-hotkeys-hook ignores keystrokes inside inputs and
 *  contenteditable editors by default, so typing "c" in a draft is safe). */
export function ComposeButton({ className }: { className?: string }) {
	const openCompose = useEmailUIStore((s) => s.openCompose);

	useHotkeys("c", openCompose, { preventDefault: true });

	return (
		<button
			type="button"
			onClick={openCompose}
			className={cn(
				"group flex h-10 w-full items-center gap-2.5 rounded-lg bg-gradient-to-b from-primary to-primary/85 px-4 font-medium text-primary-foreground text-sm shadow-md shadow-primary/25 transition-all hover:shadow-lg hover:shadow-primary/35 hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card active:scale-[0.98]",
				className,
			)}
		>
			<SquarePen className="size-4 transition-transform group-hover:-rotate-6" />
			<span className="flex-1 text-left">Compose</span>
			<kbd className="rounded border border-primary-foreground/25 bg-primary-foreground/10 px-1.5 py-px font-sans text-[10px] text-primary-foreground/85 leading-4">
				C
			</kbd>
		</button>
	);
}
