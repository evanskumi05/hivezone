"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useFeed } from "@/components/providers/FeedProvider";

// Components
import Sidebar from "@/components/dashboard/Sidebar";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import MainFeed from "@/components/dashboard/MainFeed";
import RecentGigs from "@/components/dashboard/RecentGigs";

export default function DashboardPage() {
    const router = useRouter();
    const supabase = createClient();
    const { scrollPosition, setScrollPosition, pageProfile, setPageProfile } = useFeed();
    const scrollSaveRef = useRef(scrollPosition);
    const containerRef = useRef(null);

    const setContainerRef = (el) => {
        if (!el || containerRef.current === el) return;
        containerRef.current = el;
        el.addEventListener('scroll', () => { scrollSaveRef.current = el.scrollTop; }, { passive: true });
    };

    const restoreScroll = () => {
        const el = containerRef.current;
        if (!el || scrollSaveRef.current === 0) return;
        setTimeout(() => { el.scrollTop = scrollSaveRef.current; }, 50);
    };

    useEffect(() => {
        if (pageProfile) return;
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/auth/signin"); return; }
            const { data: profileData } = await supabase
                .from("users")
                .select("first_name, email")
                .eq("id", session.user.id)
                .single();
            if (profileData) setPageProfile(profileData);
        };
        fetchUser();
    }, []);

    // Persist scroll position to context on unmount
    useEffect(() => {
        return () => { setScrollPosition(scrollSaveRef.current); };
    }, []);

    return (
        <div className="flex h-full bg-[#fcf6de] p-4 sm:p-8 pt-0 gap-6 max-w-[1600px] mx-auto w-full">
            <div className="shrink-0 flex-col hidden lg:flex">
                <Sidebar />
            </div>
            <div
                id="dashboard-scroll-container"
                className="flex-1 overflow-y-auto scrollbar-hide"
                ref={setContainerRef}
            >
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-6 h-full items-start">
                    <div className="flex flex-col gap-8 max-w-[800px]">
                        <WelcomeBanner firstName={pageProfile?.first_name} email={pageProfile?.email} />
                        <MainFeed onPostsReady={restoreScroll} />
                    </div>
                    <div className="flex flex-col gap-6 hidden lg:flex">
                        <RecentGigs />
                    </div>
                </div>
            </div>
        </div>
    );
}
