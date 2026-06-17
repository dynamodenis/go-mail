import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { prefetchAllData } from "@/lib/prefetch";

/** Warms feature caches in the background once the authenticated shell has
 *  mounted. Client-only (runs in an effect, so never on the server) and
 *  non-blocking — it never delays first paint. Call it from a landing surface
 *  (e.g. the dashboard) so navigating onward (inbox, etc.) is instant. */
export function usePrefetchAllData() {
	const queryClient = useQueryClient();
	useEffect(() => {
		prefetchAllData(queryClient);
	}, [queryClient]);
}
