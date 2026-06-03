import { CheckCircle2, Mail } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { NylasConnection } from "../types";

interface NylasConnectionCardProps {
	connection: NylasConnection;
	onConnect: () => void;
	onDisconnect: () => void;
	isConnecting: boolean;
	isDisconnecting: boolean;
}

/** Presentational card for the Nylas email/calendar connection. Renders one of
 *  three states: not configured (server env missing), not connected (Connect
 *  CTA), or connected (account + Disconnect). */
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
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-center gap-3">
						<span className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
							<Mail className="h-5 w-5" aria-hidden="true" />
						</span>
						<div>
							<CardTitle>Nylas</CardTitle>
							<CardDescription>
								Connect an email account to sync inbox, sent mail, and calendar.
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
						Nylas isn&apos;t configured on this server yet. Set{" "}
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
						in your environment to enable email and calendar.
					</p>
				) : connected ? (
					<div className="flex items-center justify-between gap-4">
						<p className="text-sm text-muted-foreground">
							Connected as{" "}
							<span className="font-medium text-foreground">
								{email || "your account"}
							</span>
						</p>
						<Button
							variant="outline"
							size="sm"
							onClick={onDisconnect}
							disabled={isDisconnecting}
						>
							{isDisconnecting ? "Disconnecting…" : "Disconnect"}
						</Button>
					</div>
				) : (
					<div className="flex items-center justify-between gap-4">
						<p className="text-sm text-muted-foreground">
							No account connected.
						</p>
						<Button size="sm" onClick={onConnect} disabled={isConnecting}>
							{isConnecting ? "Redirecting…" : "Connect Nylas"}
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
