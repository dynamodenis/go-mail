import { Button } from "@/components/ui/button";
import { MailPlus } from "lucide-react";

/** Shown in the thread list when the user has no connected mailbox (or the
 *  server has no Nylas env). Per the CLAUDE.md feature-flag rule, this is a CTA
 *  to connect rather than an error state. */
export function EmailNotConnected() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
			<div className="flex size-10 items-center justify-center rounded-xl border bg-muted/40 text-muted-foreground">
				<MailPlus className="size-4" />
			</div>
			<div className="flex flex-col gap-1">
				<p className="font-medium text-foreground text-sm">
					No mailbox connected
				</p>
				<p className="max-w-xs text-muted-foreground text-xs">
					Connect a Gmail or Outlook account to read your inbox, sent mail, and
					drafts here.
				</p>
			</div>
			<Button size="sm" asChild>
				<a href="/settings/integrations">Connect a mailbox</a>
			</Button>
		</div>
	);
}
