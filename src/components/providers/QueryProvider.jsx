"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { get, set, del, keys } from "idb-keyval";

/**
 * Global Query Client for HiveZone.
 * Configured with 15-minute stale-time for optimal background sync.
 */
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60, // Default 1 minute
            gcTime: 1000 * 60 * 60 * 24,
            retry: 2,
            refetchOnWindowFocus: false,
        },
    },
});

// Granular Calibration
queryClient.setQueryDefaults(['FEED_STREAM'], { staleTime: 1000 * 60 * 15 }); // 15 mins
queryClient.setQueryDefaults(['NOTIFICATIONS'], { staleTime: 1000 * 10 });    // 10 secs
queryClient.setQueryDefaults(['CONVERSATIONS'], { staleTime: 1000 * 5 });     // 5 secs
queryClient.setQueryDefaults(['USER_PROFILE'], { staleTime: 1000 * 60 * 5 });  // 5 mins

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
                        return [
                            'FEED_STREAM',
                            'USER_PROFILE',
                            'CONVERSATIONS',
                            'GIGS_LIST',
                            'STUDY_CIRCLES'
                        ].includes(query.queryKey[0]);
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
    // Scrub sensitive data before persistence
    const { email, ...scrubbed } = profile;
    localStorage.setItem("HIVEZONE_USER_IDENTITY", JSON.stringify(scrubbed));
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

// Call this on sign-out or user switch to prevent stale data leaking
export const clearAllUserCache = async () => {
    if (typeof window === "undefined") return;
    // Clear identity disk cache
    localStorage.removeItem("HIVEZONE_USER_IDENTITY");
    // Clear IndexedDB query cache
    await del("HIVEZONE_V1_CACHE");
    // Clear chat storage
    const allKeys = await keys();
    const chatKeys = allKeys.filter(k => typeof k === 'string' && (k.startsWith('HZ_MSGS_') || k === 'HZ_CONVS_v1'));
    await Promise.all(chatKeys.map(k => del(k)));
    // Clear TanStack Query in-memory cache
    queryClient.clear();
};
