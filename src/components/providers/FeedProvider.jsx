"use client";

import React, { createContext, useContext, useState } from 'react';

const FeedContext = createContext();

export const useFeed = () => {
    const context = useContext(FeedContext);
    if (!context) {
        throw new Error('useFeed must be used within a FeedProvider');
    }
    return context;
};

export const FeedProvider = ({ children }) => {
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [scrollPosition, setScrollPosition] = useState(0);

    const resetFeed = () => {
        setPosts([]);
        setPage(0);
        setHasMore(true);
        setScrollPosition(0);
    };

    return (
        <FeedContext.Provider value={{
            posts, setPosts,
            page, setPage,
            hasMore, setHasMore,
            activeTab, setActiveTab,
            scrollPosition, setScrollPosition,
            resetFeed
        }}>
            {children}
        </FeedContext.Provider>
    );
};
