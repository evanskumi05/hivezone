"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { getOrCreateConversation } from "@/utils/chat";
import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare02Icon } from "@hugeicons/core-free-icons";
import { ProfileSkeleton } from "@/components/ui/Skeleton";
import Avatar from "@/components/ui/Avatar";

export default function PublicProfilePage() {
    const router = useRouter();
    const params = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            if (!params?.username) return;

            // Get current session for redirection logic
            const { data: { session } } = await supabase.auth.getSession();
            const loggedInId = session?.user?.id;
            setCurrentUserId(loggedInId);

            // Fetch profile data from public.users table using the URL parameter
            const { data: profileData, error } = await supabase
                .from("users")
                .select("*")
                .ilike("username", params.username)
                .single();

            if (error || !profileData) {
                console.error("Error fetching public user profile:", error);
                setNotFound(true);
            } else {
                // REDIRECTION LOGIC: If this is the logged in user's own profile, go to the editable one
                if (loggedInId && profileData.id === loggedInId) {
                    router.replace("/dashboard/profile");
                    return;
                }
                setProfile(profileData);
            }

            setLoading(false);
        };

        fetchUser();
    }, [params?.username, supabase]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white md:bg-[#fcf6de]">
                <ProfileSkeleton />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-32px)] w-full items-center justify-center bg-white md:bg-[#fcf6de] text-center px-4">
                <h1 className="text-4xl font-black font-newyork text-gray-900 mb-2">User Not Found</h1>
                <p className="text-gray-500 font-medium">The profile "@{(params?.username)?.toString()}" does not exist or has been removed.</p>
                <button onClick={() => router.push('/dashboard')} className="mt-6 px-6 py-2 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors">
                    Return to Dashboard
                </button>
            </div>
        );
    }

    // Safely parse skills
    const parseStringList = (str) => {
        if (!str || typeof str !== 'string' || str.trim() === '') return [];
        const cleanStr = str.replace(/[\[\]"']/g, '').replace(/\n/g, ',');
        return cleanStr.split(',').map(s => s.trim()).filter(s => s);
    };

    const skillsList = Array.isArray(profile?.skills)
        ? profile.skills
        : parseStringList(profile?.skills);

    // Normalize portfolio link to ensure it starts with http:// or https://
    const getValidUrl = (url) => {
        if (!url || url.trim() === "") return "";
        const trimmedUrl = url.trim();
        if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
            return trimmedUrl;
        }
        return `https://${trimmedUrl}`;
    };

    const singlePortfolioLink = profile?.portfolio_links?.trim() || "";
    const portfolioUrl = getValidUrl(singlePortfolioLink);

    return (
        <div className="flex flex-col h-full bg-white md:bg-[#fcf6de] md:p-4 lg:p-8 md:pt-0 max-w-[950px] mx-auto w-full">

            {/* Main Content Layout */}
            <div className="flex-1 overflow-y-auto scrollbar-hide pb-20 md:pb-10 w-full">
                <div className="bg-white md:bg-[#f4f4f4] md:rounded-[2.5rem] w-full min-h-[85vh] flex flex-col overflow-hidden relative md:border md:border-gray-200 md:shadow-sm">

                    {/* Cover Photo Area */}
                    <div className="h-32 sm:h-48 md:h-72 w-full relative">
                        {profile?.cover_photo ? (
                            <img
                                src={profile.cover_photo}
                                alt="Cover Photo"
                                className="w-full h-full object-cover object-center grayscale opacity-90 md:rounded-t-[2.5rem]"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-200 md:rounded-t-[2.5rem]"></div>
                        )}
                    </div>

                    {/* Profile Section */}
                    <div className="relative px-4 sm:px-8 md:px-12 pb-12 flex-1">

                        {/* Avatar overlapping cover */}
                        <div className="absolute -top-10 sm:-top-16 left-4 sm:left-8 md:left-12 z-30">
                            <div className="w-[84px] h-[84px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] rounded-full border-[4px] md:border-[6px] border-white md:border-[#f4f4f4] overflow-hidden bg-gray-200 shadow-sm relative">
                                <Avatar
                                    src={profile?.profile_picture}
                                    name="Profile Avatar"
                                    className="w-full h-full"
                                />
                            </div>
                        </div>

                        {/* Top row: Message Button aligned to the right */}
                        <div className="w-full flex justify-end pt-3 md:pt-6">
                            <button
                                onClick={async () => {
                                    try {
                                        const chatId = await getOrCreateConversation(profile.id);
                                        router.push(`/dashboard/chat/${chatId}`);
                                    } catch (err) {
                                        console.error("Error starting chat:", err);
                                    }
                                }}
                                className="px-4 py-1.5 md:px-6 md:py-2 rounded-full border border-gray-300 md:border-[#ffc107] bg-white md:bg-[#ffc107] text-gray-900 md:text-black font-bold text-[13px] md:text-[15px] hover:bg-gray-50 md:hover:bg-[#ffb300] transition-colors shadow-sm"
                            >
                                Message
                            </button>
                        </div>

                        {/* Main Grid: Info + Banner on Left, Skills+Links on Right */}
                        <div className="mt-2 md:mt-2 grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8 md:gap-16 lg:gap-32 w-full max-w-5xl relative z-10">

                            {/* Left Column (Info) */}
                            <div className="flex flex-col mt-2 md:mt-0">
                                {/* Info Block */}
                                <h1 className="text-[26px] md:text-3xl sm:text-[34px] font-black font-newyork text-gray-900 tracking-tight leading-none">
                                    {profile?.display_name || (profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : "")}
                                </h1>
                                <span className="text-[14px] font-medium mt-1 text-gray-500">
                                    {profile?.username ? `@${profile.username}` : ""}
                                </span>

                                <div className="flex flex-col text-[13px] text-gray-600 font-medium mt-3 gap-0.5">
                                    <span>{profile?.institution || "Institution not provided"}</span>
                                    <span>{profile?.programme || "Programme not provided"}</span>
                                </div>

                                <p className="text-[13px] text-gray-600 font-medium mt-4 leading-relaxed pr-8">
                                    {profile?.bio || "This user hasn't written a bio yet."}
                                </p>
                            </div>

                            {/* Right Column (Skills, Portfolio) */}
                            <div className="flex flex-col gap-8 pt-2 md:pt-1">
                                {skillsList.length > 0 && (
                                    <div>
                                        <h3 className="text-[19px] font-black font-newyork text-gray-900 mb-3 tracking-wide">Skills</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <div className="px-4 py-1.5 rounded-full border border-[#ffc107] text-[13px] font-semibold flex items-center bg-[#fdfdfd] shadow-sm">
                                                {skillsList.map((skill, index) => (
                                                    <React.Fragment key={index}>
                                                        <span className="text-gray-500">{skill}</span>
                                                        {index < skillsList.length - 1 && <div className="w-px h-3.5 bg-gray-300 mx-2.5"></div>}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {singlePortfolioLink && (
                                    <div>
                                        <h3 className="text-[19px] font-black font-newyork text-gray-900 mb-3 tracking-wide">Portfolio Link</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <a
                                                href={portfolioUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-1.5 rounded-full border border-[#ffc107] text-[#ffb300] hover:text-[#e09e00] text-[13px] font-bold flex items-center gap-2 bg-[#fdfdfd] shadow-sm hover:bg-[#fcfcfc] transition-colors"
                                            >
                                                <HugeiconsIcon icon={LinkSquare02Icon} className="w-4 h-4" />
                                                <span>{singlePortfolioLink}</span>
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
