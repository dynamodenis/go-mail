import {
	useQuery,
	useMutation,
	useQueryClient,
	type QueryClient,
	type UseQueryOptions,
} from "@tanstack/react-query";
import { unwrap } from "@/lib/server-result";
import * as server from "./server";

export const settingsKeys = {
	all: ["settings"] as const,
	nylasConnection: () => [...settingsKeys.all, "nylas-connection"] as const,
};

// Settings are static-ish — refetch sparingly (CLAUDE.md: 10min for settings).
const STALE_10_MIN = 600_000;

export function useNylasConnection(queryClient?: QueryClient) {
	return useQuery(
		{
			queryKey: settingsKeys.nylasConnection(),
			queryFn: async () => unwrap(await server.getNylasConnection()),
			staleTime: STALE_10_MIN,
		} satisfies UseQueryOptions,
		queryClient,
	);
}

/** Starts the hosted-auth flow and hands back the URL to redirect to. The caller
 *  performs the redirect (`window.location.href = url`) so the browser leaves
 *  the app for Nylas's consent screen. */
export function useStartNylasConnect(queryClient?: QueryClient) {
	const qc = queryClient ?? useQueryClient();
	return useMutation(
		{
			mutationFn: async () => unwrap(await server.startNylasConnect()),
		},
		qc,
	);
}

export function useDisconnectNylas(queryClient?: QueryClient) {
	const qc = queryClient ?? useQueryClient();
	return useMutation(
		{
			mutationFn: async () => unwrap(await server.disconnectNylas()),
			onSuccess: () => {
				qc.invalidateQueries({ queryKey: settingsKeys.nylasConnection() });
			},
		},
		qc,
	);
}
