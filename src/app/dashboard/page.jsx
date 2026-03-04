"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

// Components
import Sidebar from "@/components/dashboard/Sidebar";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import CampusFeeds from "@/components/dashboard/CampusFeeds";
import RecentGigs from "@/components/dashboard/RecentGigs";

export default function DashboardPage() {
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push("/auth/signin");
                return;
            }

            // Fetch profile data from public.users table
            const { data: profileData } = await supabase
                .from("users")
                .select("*")
                .eq("id", session.user.id)
                .single();

            if (profileData) {
                setProfile(profileData);
            }

            setLoading(false);
        };

        fetchUser();
    }, [router, supabase]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fcf6de]">
                <div className="w-8 h-8 border-4 border-[#ffc107] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-[#fcf6de] p-4 sm:p-8 pt-0 gap-6 max-w-[1600px] mx-auto w-full">
            {/* Left Sidebar Layout */}
            <div className="shrink-0 flex-col hidden lg:flex">
                <Sidebar />
            </div>

            {/* Main Content Layout */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-6 h-full items-start">

                    {/* Center Column / Feeds */}
                    <div className="flex flex-col gap-8">
                        <WelcomeBanner firstName={profile?.first_name} email={profile?.email} />
                        <CampusFeeds />
                    </div>

                    {/* Right Column / Widgets */}
                    <div className="flex flex-col gap-6 hidden lg:flex">
                        <RecentGigs />
                    </div>
                </div>
            </div>
        </div>
    );
}
