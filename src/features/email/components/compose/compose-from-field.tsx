import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNylasConnection } from "@/features/settings/api/queries";
import { Check, ChevronDown } from "lucide-react";

interface ComposeFromFieldProps {
	/** Selected connected-account id; null means "use the primary mailbox". */
	fromAccountId: string | null;
	onChange: (accountId: string) => void;
}

/** The From row of the composer, listing the user's connected Nylas mailboxes.
 *  Renders nothing until more than one mailbox is connected — with a single
 *  account there's no choice to make, so the row stays out of the way
 *  (Superhuman-style). Selection is by NylasAccount id only; grant ids are
 *  bearer-equivalent secrets and never reach the client — the send server
 *  function resolves accountId → grant after checking ownership. */
export function ComposeFromField({
	fromAccountId,
	onChange,
}: ComposeFromFieldProps) {
	const { data } = useNylasConnection();
	const accounts = data?.accounts ?? [];
	// No mailbox connected yet — nothing to send from, so no row to show.
	if (accounts.length === 0) return null;

	const selected =
		accounts.find((a) => a.id === fromAccountId) ??
		accounts.find((a) => a.isPrimary) ??
		accounts[0];

	return (
		<div className="flex min-h-9 shrink-0 items-center gap-2 border-b px-4 py-1.5">
			<span className=" text-muted-foreground text-sm">From</span>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						aria-label="From account"
						className="flex min-w-0 items-center gap-1.5 rounded px-1.5 py-0.5 text-sm transition-colors hover:bg-muted"
					>
						<span className="truncate">{selected.email}</span>
						<ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="min-w-[260px]">
					{accounts.map((account) => (
						<DropdownMenuItem
							key={account.id}
							onSelect={() => onChange(account.id)}
							className="gap-2.5"
						>
							<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-xs">
								{account.email[0].toUpperCase()}
							</span>
							<span className="min-w-0 flex-1 truncate text-sm">
								{account.email}
							</span>
							{account.isPrimary && (
								<span className="shrink-0 text-muted-foreground text-xs">
									default
								</span>
							)}
							{account.id === selected.id && (
								<Check className="size-3.5 shrink-0 text-primary" />
							)}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
