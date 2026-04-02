"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { get, set, del } from "idb-keyval";

/**
 * Global Query Client for HiveZone.
 * Configured with 15-minute stale-time for optimal background sync.
 */
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 15,
            gcTime: 1000 * 60 * 60 * 24,
            retry: 2,
            refetchOnWindowFocus: false,
        },
    },
});

/**
 * Robust IndexedDB Persister (No 5MB limit).
 * This ensures the feed cache persists reliably on the device.
 */
const persister = {
    persistClient: async (client) => {
        await set("HIVEZONE_V1_CACHE", client);
    },
    restoreClient: async () => {
        return await get("HIVEZONE_V1_CACHE");
    },
    removeClient: async () => {
        await del("HIVEZONE_V1_CACHE");
    },
};

export function QueryProvider({ children }) {
    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ 
                persister,
                maxAge: 1000 * 60 * 60 * 24, // 24 Hours
                hydrateOptions: {
                    shouldDehydrateQuery: (query) => {
                        // Persist the feed stream and profile for 0ms cold-starts
                        return query.queryKey[0] === 'FEED_STREAM' || query.queryKey[0] === 'USER_PROFILE';
                    }
                }
            }}
        >
            {children}
        </PersistQueryClientProvider>
    );
}

/**
 * Identity Disk Caching.
 * Used for the Welcome Banner's 0ms instant-mount.
 */
export const saveProfileToDisk = (profile) => {
    if (typeof window === "undefined" || !profile) return;
    localStorage.setItem("HIVEZONE_USER_IDENTITY", JSON.stringify(profile));
};

export const getProfileFromDisk = () => {
    if (typeof window === "undefined") return null;
    try {
        const stored = localStorage.getItem("HIVEZONE_USER_IDENTITY");
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        return null;
    }
};
