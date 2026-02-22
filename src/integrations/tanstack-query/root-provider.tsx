import { QueryClient, useQueryClient } from "@tanstack/react-query";
import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";
import { useEffect, useRef } from "react";

import { STORAGE_KEYS } from "@/lib/constants";

const idbValidKey = STORAGE_KEYS.QUERY_CACHE;

function createIDBPersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      await set(idbValidKey, client);
    },
    restoreClient: async () => {
      return get<PersistedClient>(idbValidKey);
    },
    removeClient: async () => {
      await del(idbValidKey);
    },
  };
}

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes - don't refetch if data is fresh
        gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep data in cache for persistence
        refetchInterval: 1000 * 60 * 5, // 5 minutes - refetch every 5 minutes
        refetchOnMount: false, // Don't refetch when component mounts if data exists
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
        refetchOnReconnect: false, // Don't refetch when network reconnects
      },
    },
  });

  return {
    queryClient,
  };
}

/**
 * Hook to set up IndexedDB persistence for the QueryClient.
 * Must be called inside a component that's rendered on the client.
 */
export function useQueryPersistence() {
  const queryClient = useQueryClient();
  const isSetupRef = useRef(false);

  useEffect(() => {
    if (isSetupRef.current) return;
    isSetupRef.current = true;

    const persister = createIDBPersister();

    persistQueryClient({
      queryClient,
      persister,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      buster: "", // Cache buster - change to invalidate all persisted data
    });
  }, [queryClient]);
}
