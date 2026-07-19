import { SquarePen } from "lucide-react";
import { useEmailUIStore } from "../../api/store";

/** Mobile-only floating Compose action — the sidebar holding the main Compose
 *  button is hidden below `md`, so small screens get a Gmail-style FAB pinned
 *  to the bottom-right instead. Hides while the compose window is open so it
 *  never sits behind the sheet it opened. */
export function ComposeFab() {
	const open = useEmailUIStore((s) => s.composeOpen);
	const openCompose = useEmailUIStore((s) => s.openCompose);

	if (open) return null;

	return (
		<button
			type="button"
			aria-label="Compose"
			title="Compose"
			onClick={openCompose}
			className="fade-in zoom-in-75 fixed right-5 bottom-5 z-40 flex size-14 animate-in items-center justify-center rounded-2xl bg-gradient-to-b from-primary to-primary/85 text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-200 hover:shadow-primary/40 hover:shadow-xl hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 md:hidden"
		>
			<SquarePen className="size-5" />
		</button>
	);
}
