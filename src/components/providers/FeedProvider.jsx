"use client";

import React, { createContext, useContext, useState, useMemo } from 'react';
import { getProfileFromDisk, saveProfileToDisk } from './QueryProvider';

const FeedContext = createContext();

export const useFeed = () => {
    const context = useContext(FeedContext);
    if (!context) {
        throw new Error('useFeed must be used within a FeedProvider');
    }
    return context;
};

/**
 * Optimized FeedProvider.
 * Focuses on identity management and UI state persistence (tabs).
 * Data management (posts/pagination) is offloaded to TanStack Query for better caching and performance.
 */
export const FeedProvider = ({ children }) => {
    // UI Persistence State
    const [activeTab, setActiveTab] = useState('all');
    
    // Identity State
    const [pageProfile, setPageProfileState] = useState(null);
    const [hasMounted, setHasMounted] = useState(false);

    // Securely hydrate profile from disk on mount
    React.useEffect(() => {
        setHasMounted(true);
        const stored = getProfileFromDisk();
        if (stored) {
            // Lazy load supabase to keep initial bundle light
            import('@/utils/supabase/client').then(({ createClient }) => {
                const supabase = createClient();
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (session?.user?.id && stored.id === session.user.id) {
                        setPageProfileState(stored);
                    } else {
                        // Mismatch or no session — clear stale disk cache
                        localStorage.removeItem('HIVEZONE_USER_IDENTITY');
                    }
                });
            });
        }
    }, []);

    const setPageProfile = (profile) => {
        setPageProfileState(profile);
        saveProfileToDisk(profile);
    };

    const contextValue = useMemo(() => ({
        activeTab, setActiveTab,
        pageProfile: hasMounted ? pageProfile : null,
        setPageProfile,
    }), [activeTab, pageProfile, hasMounted]);

    return (
        <FeedContext.Provider value={contextValue}>
            {children}
        </FeedContext.Provider>
    );
};
