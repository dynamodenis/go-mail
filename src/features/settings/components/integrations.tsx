import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { toast } from "@/components/ui/sooner";
import { useEffect } from "react";
import {
	useDisconnectNylas,
	useNylasConnection,
	useSetPrimaryNylasAccount,
	useStartNylasConnect,
} from "../api/queries";
import { NylasConnectionCard } from "./nylas-connection-card";

/** Settings > Integrations page. Orchestrates the Nylas connection card and the
 *  connect/disconnect/set-primary actions; presentation lives in
 *  NylasConnectionCard. */
export default function Integrations() {
	const connection = useNylasConnection();
	const startConnect = useStartNylasConnect();
	const disconnect = useDisconnectNylas();
	const setPrimary = useSetPrimaryNylasAccount();

	useNylasCallbackToast();

	function handleConnect() {
		startConnect.mutate(undefined, {
			onSuccess: ({ url }) => {
				// Leave the app for Nylas's hosted consent screen.
				window.location.href = url;
			},
			onError: (err) => toast.error(err.message),
		});
	}

	function handleDisconnect(accountId: string) {
		disconnect.mutate(accountId, {
			onSuccess: () => toast.success("Email account disconnected."),
			onError: (err) => toast.error(err.message),
		});
	}

	function handleSetPrimary(accountId: string) {
		setPrimary.mutate(accountId, {
			onSuccess: () => toast.success("Primary account updated."),
			onError: (err) => toast.error(err.message),
		});
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Integrations</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Connect external services that power your inbox, sent mail, and
					calendar.
				</p>
			</div>

			{connection.isLoading ? (
				<LoadingState message="Loading integrations…" />
			) : connection.isError ? (
				<ErrorState onRetry={() => connection.refetch()} />
			) : connection.data ? (
				<NylasConnectionCard
					connection={connection.data}
					onConnect={handleConnect}
					onDisconnect={handleDisconnect}
					onSetPrimary={handleSetPrimary}
					isConnecting={startConnect.isPending}
					disconnectingId={
						disconnect.isPending ? (disconnect.variables ?? null) : null
					}
					settingPrimaryId={
						setPrimary.isPending ? (setPrimary.variables ?? null) : null
					}
				/>
			) : null}
		</div>
	);
}

/** Surfaces the `?nylas=connected|error` flag the callback route redirects with
 *  as a toast, then strips it from the URL so a refresh doesn't re-toast. */
function useNylasCallbackToast() {
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const status = params.get("nylas");
		if (!status) return;

		if (status === "connected") {
			toast.success("Nylas connected.");
		} else {
			toast.error("Couldn't connect Nylas. Please try again.");
		}

		params.delete("nylas");
		params.delete("reason");
		const query = params.toString();
		window.history.replaceState(
			{},
			"",
			window.location.pathname + (query ? `?${query}` : ""),
		);
	}, []);
}
