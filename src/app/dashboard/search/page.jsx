"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Search01Icon,
    ArrowRight01Icon,
    Cancel01Icon
} from "@hugeicons/core-free-icons";
import Link from 'next/link';

function SearchResults() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [localQuery, setLocalQuery] = useState(query);
    const [currentUserId, setCurrentUserId] = useState(null);
    const supabase = createClient();

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                setCurrentUserId(session.user.id);
            }
        };
        getSession();
    }, [supabase]);

    useEffect(() => {
        setLocalQuery(query);
        if (query.trim()) {
            handleSearch(query.trim());
        } else {
            setResults([]);
        }
    }, [query]);

    const handleSearch = async (searchTerm) => {
        setLoading(true);
        // Search by username or display_name
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .or(`display_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
            .limit(20);

        if (error) {
            console.error('Search error:', error);
        } else {
            setResults(data || []);
        }
        setLoading(false);
    };

    const onLocalSearch = (e) => {
        e.preventDefault();
        if (localQuery.trim()) {
            router.push(`/dashboard/search?q=${encodeURIComponent(localQuery.trim())}`);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#fcf6de] md:bg-[#fcf6de] pb-32 pt-4 md:pt-8">
            <div className="max-w-4xl mx-auto w-full px-4 md:px-8">

                {/* Mobile Search Bar (Global navbar search is hidden on small screens) */}
                <div className="md:hidden mb-6">
                    <form onSubmit={onLocalSearch} className="relative flex items-center">
                        <input
                            type="text"
                            placeholder="search your hive..."
                            value={localQuery}
                            onChange={(e) => setLocalQuery(e.target.value)}
                            className="w-full h-14 pl-5 pr-12 bg-white border border-gray-200 rounded-2xl text-[16px] outline-none shadow-sm placeholder:text-gray-400 font-medium focus:border-[#ffc107] transition-all"
                        />
                        <button type="submit" className="absolute right-4">
                            <HugeiconsIcon icon={Search01Icon} className="w-6 h-6 text-gray-400" strokeWidth={2} />
                        </button>
                    </form>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black font-newyork text-gray-900 leading-none">
                            Search Results
                        </h1>
                        <p className="text-gray-500 font-medium text-sm mt-2">
                            {query ? `Showing results for "${query}"` : "Search for users in your hive"}
                        </p>
                    </div>
                </div>

                {/* Results List */}
                <div className="flex flex-col gap-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-[#ffc107] border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-500 font-bold text-sm">Searching the hive...</p>
                        </div>
                    ) : results.length > 0 ? (
                        results.map((user) => (
                            <Link
                                href={user.id === currentUserId ? '/dashboard/profile' : `/dashboard/profile/${user.username || user.id}`}
                                key={user.id}
                                className="bg-white p-4 rounded-3xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:border-[#ffc107] transition-all group active:scale-[0.98]"
                            >
                                <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-gray-100 bg-gray-50">
                                    <img
                                        src={user.profile_picture}
                                        alt={user.display_name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-gray-900 truncate">
                                        {user.display_name || user.username}
                                    </h3>
                                    <p className="text-xs font-bold text-gray-500">@{user.username || 'user'}</p>
                                    {user.bio && (
                                        <p className="text-xs text-gray-400 truncate mt-1">{user.bio}</p>
                                    )}
                                </div>
                                <HugeiconsIcon
                                    icon={ArrowRight01Icon}
                                    className="w-5 h-5 text-gray-300 group-hover:text-[#ffc107] transition-colors"
                                    strokeWidth={1.5}
                                />
                            </Link>
                        ))
                    ) : query.trim() ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                <HugeiconsIcon icon={Cancel01Icon} className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-black font-newyork text-gray-900">No one found</h3>
                            <p className="text-gray-500 text-sm mt-1 max-w-[240px]">
                                We couldn't find any users matching "{query}". Try a different spelling.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
                            <HugeiconsIcon icon={Search01Icon} className="w-12 h-12 mb-4 opacity-20" strokeWidth={1.5} />
                            <p className="font-bold text-sm">Whom are you looking for?</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-[#fcf6de]">
                <div className="w-10 h-10 border-4 border-[#ffc107] border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <SearchResults />
        </Suspense>
    );
}
