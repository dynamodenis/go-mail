import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, ExternalLink, Mail, Plus, PlugZap } from "lucide-react";
import type { NylasConnection } from "../types";
import { NylasAccountRow } from "./nylas-account-row";

interface NylasConnectionCardProps {
	connection: NylasConnection;
	onConnect: () => void;
	onDisconnect: (accountId: string) => void;
	onSetPrimary: (accountId: string) => void;
	isConnecting: boolean;
	disconnectingId: string | null;
	settingPrimaryId: string | null;
}

/** Presentational card for the user's Nylas-connected mailboxes. Renders one of
 *  three states: not configured (server env missing), no accounts (Connect CTA),
 *  or a list of connected accounts with per-account primary/disconnect actions
 *  plus a "connect another" action. */
export function NylasConnectionCard({
	connection,
	onConnect,
	onDisconnect,
	onSetPrimary,
	isConnecting,
	disconnectingId,
	settingPrimaryId,
}: NylasConnectionCardProps) {
	const { configured, accounts } = connection;
	const hasAccounts = accounts.length > 0;

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="flex items-center gap-3">
						<span className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
							<Mail className="h-5 w-5" aria-hidden="true" />
						</span>
						<div>
							<div className="flex flex-wrap items-center gap-2">
								<CardTitle>Email accounts</CardTitle>
								<Badge variant="outline" className="gap-1">
									<PlugZap className="h-3.5 w-3.5" aria-hidden="true" />
									Nylas
								</Badge>
							</div>
							<CardDescription>
								Connect one or more Gmail or Outlook mailboxes through Nylas to
								power inbox, sent mail, and calendar access.
							</CardDescription>
						</div>
					</div>
					{hasAccounts && (
						<Badge variant="secondary" className="gap-1">
							<CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
							{accounts.length} connected
						</Badge>
					)}
				</div>
			</CardHeader>

			<CardContent>
				{!configured ? (
					<NotConfiguredNotice />
				) : !hasAccounts ? (
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="space-y-1">
							<p className="text-sm text-muted-foreground">
								No email accounts connected.
							</p>
							<p className="text-muted-foreground text-xs">
								Start the Nylas hosted flow to add an email account.
							</p>
						</div>
						<Button size="sm" onClick={onConnect} disabled={isConnecting}>
							{isConnecting ? "Redirecting…" : "Connect email"}
						</Button>
					</div>
				) : (
					<div className="space-y-4">
						<ul className="space-y-2">
							{accounts.map((account) => (
								<NylasAccountRow
									key={account.id}
									account={account}
									onDisconnect={onDisconnect}
									onSetPrimary={onSetPrimary}
									isDisconnecting={disconnectingId === account.id}
									isSettingPrimary={settingPrimaryId === account.id}
								/>
							))}
						</ul>
						<div className="flex flex-wrap gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={onConnect}
								disabled={isConnecting}
							>
								<Plus className="h-4 w-4" aria-hidden="true" />
								{isConnecting ? "Redirecting…" : "Connect another account"}
							</Button>
							<Button size="sm" asChild>
								<a href="/email">
									Open inbox
									<ExternalLink className="h-4 w-4" aria-hidden="true" />
								</a>
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

/** Shown when the server has no Nylas env configured. */
function NotConfiguredNotice() {
	return (
		<p className="text-sm text-muted-foreground">
			Email connection isn&apos;t configured on this server yet. Set{" "}
			<code className="rounded bg-muted px-1 py-0.5 text-xs">
				NYLAS_CLIENT_ID
			</code>
			,{" "}
			<code className="rounded bg-muted px-1 py-0.5 text-xs">NYLAS_API_KEY</code>{" "}
			and{" "}
			<code className="rounded bg-muted px-1 py-0.5 text-xs">
				NYLAS_REDIRECT_URI
			</code>{" "}
			in your environment to enable Nylas email and calendar access.
		</p>
	);
}
