"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import Avatar from "@/components/ui/Avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge01Icon } from "@hugeicons/core-free-icons";

const RecentGigs = () => {
    const [gigs, setGigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchRecentGigs = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                let userInstitution = null;

                if (session) {
                    const { data: profileData } = await supabase
                        .from("users")
                        .select("institution")
                        .eq("id", session.user.id)
                        .single();
                    userInstitution = profileData?.institution;
                }

                if (!userInstitution) {
                    setLoading(false);
                    return;
                }

                const { data, error } = await supabase
                    .from('gigs')
                    .select(`
                        *,
                        author:users!inner (
                            id,
                            display_name,
                            profile_picture,
                            is_verified,
                            programme,
                            year_of_study,
                            username,
                            institution
                        )
                    `)
                    .eq('author.institution', userInstitution)
                    .order('created_at', { ascending: false })
                    .limit(2);

                if (error) throw error;
                setGigs(data || []);
            } catch (error) {
                console.error("Error fetching recent gigs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentGigs();
    }, [supabase]);

    return (
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col gap-4">
            <h2 className="text-3xl font-black font-newyork tracking-wide text-gray-900 w-2/3">
                Recent<br />Campus Gigs
            </h2>

            <div className="flex gap-4 w-full pb-2 overflow-hidden">
                {loading ? (
                    [1, 2].map((i) => (
                        <div key={i} className="flex-1 rounded-[2rem] bg-gray-50 p-3 flex flex-col items-center animate-pulse">
                            <div className="w-14 h-14 rounded-full bg-gray-200 mb-2" />
                            <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
                            <div className="h-2 w-20 bg-gray-100 rounded mb-4" />
                            <div className="h-4 w-full bg-gray-200 rounded mb-2" />
                            <div className="h-6 w-12 bg-gray-200 rounded mt-auto" />
                        </div>
                    ))
                ) : gigs.length > 0 ? (
                    gigs.map((gig) => (
                        <Link
                            key={gig.id}
                            href={`/dashboard/gigs/detail?id=${gig.id}`}
                            className="flex-1 rounded-[2rem] bg-[#fde68a] p-3 flex flex-col items-center text-center shadow-sm relative hover:bg-[#ffe066] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
                        >
                            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/50 mb-2 relative">
                                <Avatar
                                    src={gig.author?.profile_picture}
                                    alt={gig.author?.display_name || "Author"}
                                    size="full"
                                />
                            </div>

                            <div className="flex items-center gap-1 mb-0.5">
                                <span className="font-bold text-gray-900 text-[14px]">
                                    {gig.author?.display_name?.split(' ')[0]}
                                </span>
                                {gig.author?.is_verified && (
                                    <HugeiconsIcon icon={CheckmarkBadge01Icon} className="w-3.5 h-3.5 text-green-600" strokeWidth={2.5} />
                                )}
                            </div>

                            <span className="text-[10px] text-gray-800 font-medium leading-tight mb-0.5 px-1 truncate w-full">
                                {gig.author?.programme || "Student"}
                            </span>
                            <span className="text-[9px] text-gray-700 font-medium opacity-80 mb-2">
                                {gig.author?.year_of_study || "Campus"}
                            </span>

                            <div className="flex-grow flex flex-col justify-center mb-4 min-h-[40px]">
                                <span className="text-[11px] font-bold leading-tight text-gray-900 line-clamp-2 group-hover:underline">
                                    {gig.title}
                                </span>
                            </div>

                            <span className="font-extrabold text-gray-900 text-lg">¢{gig.price}</span>
                        </Link>
                    ))
                ) : (
                    <div className="w-full py-10 text-center text-gray-400 font-medium text-sm italic">
                        No recent gigs found
                    </div>
                )}
            </div>

            <Link href="/dashboard/gigs" className="text-gray-800 font-medium text-sm hover:text-black hover:underline transition-all underline-offset-4 self-center mt-2">
                view full list
            </Link>
        </div>
    );
};

export default RecentGigs;
