import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail, Star } from "lucide-react";
import type { NylasAccount } from "../types";

interface NylasAccountRowProps {
	account: NylasAccount;
	onDisconnect: (accountId: string) => void;
	onSetPrimary: (accountId: string) => void;
	isDisconnecting: boolean;
	isSettingPrimary: boolean;
}

/** Presentational row for a single connected mailbox: shows the address, a
 *  primary badge or a "Make primary" action, and a disconnect action. */
export function NylasAccountRow({
	account,
	onDisconnect,
	onSetPrimary,
	isDisconnecting,
	isSettingPrimary,
}: NylasAccountRowProps) {
	return (
		<li className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex items-center gap-3">
				<span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
					<Mail className="h-4 w-4" aria-hidden="true" />
				</span>
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-sm font-medium">{account.email}</span>
					{account.isPrimary && (
						<Badge variant="secondary" className="gap-1">
							<CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
							Primary
						</Badge>
					)}
				</div>
			</div>

			<div className="flex flex-wrap gap-2">
				{!account.isPrimary && (
					<Button
						variant="outline"
						size="sm"
						onClick={() => onSetPrimary(account.id)}
						disabled={isSettingPrimary}
					>
						<Star className="h-4 w-4" aria-hidden="true" />
						{isSettingPrimary ? "Setting…" : "Make primary"}
					</Button>
				)}
				<Button
					variant="outline"
					size="sm"
					onClick={() => onDisconnect(account.id)}
					disabled={isDisconnecting}
				>
					{isDisconnecting ? "Disconnecting…" : "Disconnect"}
				</Button>
			</div>
		</li>
	);
}
