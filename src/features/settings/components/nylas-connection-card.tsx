import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, ExternalLink, Mail, PlugZap } from "lucide-react";
import type { NylasConnection } from "../types";

interface NylasConnectionCardProps {
	connection: NylasConnection;
	onConnect: () => void;
	onDisconnect: () => void;
	isConnecting: boolean;
	isDisconnecting: boolean;
}

/** Presentational card for the email account connection powered by Nylas.
 *  Renders one of three states: not configured (server env missing), not
 *  connected (Connect CTA), or connected (account + inbox/disconnect actions). */
export function NylasConnectionCard({
	connection,
	onConnect,
	onDisconnect,
	isConnecting,
	isDisconnecting,
}: NylasConnectionCardProps) {
	const { configured, connected, email } = connection;

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
								<CardTitle>Email account</CardTitle>
								<Badge variant="outline" className="gap-1">
									<PlugZap className="h-3.5 w-3.5" aria-hidden="true" />
									Nylas
								</Badge>
							</div>
							<CardDescription>
								Connect Gmail or Outlook through Nylas to power inbox, sent
								mail, and calendar access.
							</CardDescription>
						</div>
					</div>
					{connected && (
						<Badge variant="secondary" className="gap-1">
							<CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
							Connected
						</Badge>
					)}
				</div>
			</CardHeader>

			<CardContent>
				{!configured ? (
					<p className="text-sm text-muted-foreground">
						Email connection isn&apos;t configured on this server yet. Set{" "}
						<code className="rounded bg-muted px-1 py-0.5 text-xs">
							NYLAS_CLIENT_ID
						</code>
						,{" "}
						<code className="rounded bg-muted px-1 py-0.5 text-xs">
							NYLAS_API_KEY
						</code>{" "}
						and{" "}
						<code className="rounded bg-muted px-1 py-0.5 text-xs">
							NYLAS_REDIRECT_URI
						</code>{" "}
						in your environment to enable Nylas email and calendar access.
					</p>
				) : connected ? (
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="space-y-1">
							<p className="text-sm text-muted-foreground">
								Connected as{" "}
								<span className="font-medium text-foreground">
									{email || "your account"}
								</span>
							</p>
							<p className="text-muted-foreground text-xs">
								You can now use the email inbox screens with this Nylas grant.
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							<Button size="sm" asChild>
								<a href="/email/inbox">
									Open inbox
									<ExternalLink className="h-4 w-4" aria-hidden="true" />
								</a>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={onDisconnect}
								disabled={isDisconnecting}
							>
								{isDisconnecting ? "Disconnecting..." : "Disconnect"}
							</Button>
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="space-y-1">
							<p className="text-sm text-muted-foreground">
								No email account connected.
							</p>
							<p className="text-muted-foreground text-xs">
								Start the Nylas hosted flow to add an email account.
							</p>
						</div>
						<Button size="sm" onClick={onConnect} disabled={isConnecting}>
							{isConnecting ? "Redirecting..." : "Connect email"}
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
