"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useFeed } from "@/components/providers/FeedProvider";

// Components
import Sidebar from "@/components/dashboard/Sidebar";
import MainFeed from "@/components/dashboard/MainFeed";
import RecentGigs from "@/components/dashboard/RecentGigs";
import PullToRefresh from "@/components/ui/PullToRefresh";

import { useQuery } from '@tanstack/react-query';

export default function DashboardPage() {
    const router = useRouter();
    const supabase = createClient();
    const { pageProfile, setPageProfile } = useFeed();
    const mainFeedRef = React.useRef(null);

    // High-performance cached profile fetch
    const { data: profile } = useQuery({
        queryKey: ['USER_PROFILE'],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/auth/signin"); return null; }
            
            const { data: profileData } = await supabase
                .from("users")
                .select("id, first_name, institution, school_id, profile_picture")
                .eq("id", session.user.id)
                .single();
            
            if (profileData) {
                // If we have an institution but no school_id, we might need to sync it
                // (This is a safety check for automatic identification)
                setPageProfile(profileData);
            }
            return profileData;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes (Ensures fast propagation of profile updates)
    });

    const handleRefresh = async () => {
        if (mainFeedRef.current) {
            await mainFeedRef.current.refresh();
        }
    };

    return (
        <div className="flex h-full bg-[#fcf6de] px-0 sm:px-5 pt-0 gap-6 max-w-[1600px] mx-auto w-full overflow-hidden">
            {/* Sidebar Column */}
            <div className="shrink-0 flex-col hidden lg:flex h-full pt-4">
                <Sidebar />
            </div>
            
            {/* Main Content Column */}
            <div className="flex-1 min-w-0 h-full">
                <PullToRefresh onRefresh={handleRefresh} className="h-full">
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-6 h-full items-start">
                        {/* Feed Stream */}
                        <div className="flex flex-col h-full w-full max-w-[900px] mx-auto">
                            <MainFeed 
                                ref={mainFeedRef} 
                                pageProfile={pageProfile} 
                            />
                        </div>
                        
                        {/* Trending/Gigs Column */}
                        <div className="flex flex-col gap-6 hidden xl:flex h-full pt-4">
                            <RecentGigs />
                        </div>
                    </div>
                </PullToRefresh>
            </div>
        </div>
    );
}

const useRef = React.useRef;
