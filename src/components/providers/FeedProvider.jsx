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
    
    // Identity State: Synchronous Hydration from Disk
    // This removes the 'blank-frame' on first render so that the Feed Query is enabled instantly.
    const [pageProfile, setPageProfileState] = useState(() => getProfileFromDisk());

    // Background Validation: Verify cache against current server session
    React.useEffect(() => {
        const stored = getProfileFromDisk(); // Get fresh copy for validation
        if (stored) {
            import('@/utils/supabase/client').then(({ createClient }) => {
                const supabase = createClient();
                supabase.auth.getSession().then(({ data: { session } }) => {
                    // Critical security & data-integrity check
                    if (!session?.user?.id || stored.id !== session.user.id || !stored.school_id) {
                        // mismatch, stale data, or no session — clear disk cache
                        localStorage.removeItem('HIVEZONE_USER_IDENTITY');
                        setPageProfileState(null);
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
        pageProfile,
        setPageProfile,
    }), [activeTab, pageProfile]);

    return (
        <FeedContext.Provider value={contextValue}>
            {children}
        </FeedContext.Provider>
    );
};
