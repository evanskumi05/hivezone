"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Avatar from "@/components/ui/Avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import { GigCardSkeleton } from "@/components/ui/Skeleton";
import {
    Search01Icon,
    FilterIcon,
    PlusSignIcon,
    Location01Icon,
    Message01Icon,
    CheckmarkBadge01Icon,
    Cancel01Icon,
    Calendar01Icon
} from "@hugeicons/core-free-icons";
import CustomDropdown from "@/components/CustomDropdown";
import UserBadge from "@/components/ui/UserBadge";

const CATEGORIES = [
    "All Categories",
    "Academic",
    "Creative / Design",
    "Tech / Coding",
    "Errands",
    "Other"
];

const categoryMap = {
    "Academic": "academic",
    "Creative / Design": "creative",
    "Tech / Coding": "tech",
    "Errands": "errand",
    "Other": "other"
};

const SORT_OPTIONS = [
    "Latest",
    "Price: Low to High",
    "Price: High to Low"
];

export default function GigsPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [gigs, setGigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [activeCategory, setActiveCategory] = useState("All Categories");
    const [sortOrder, setSortOrder] = useState("Latest");
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const fetchGigs = async () => {
            setLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                let userInstitution = null;

                if (session) {
                    setCurrentUserId(session.user.id);
                    // Fetch user's institution
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

                let query = supabase
                    .from('gigs')
                    .select(`
                        *,
                        author:users!inner (
                            id,
                            display_name,
                            profile_picture,
                            is_verified,
                            is_admin,
                            programme,
                            year_of_study,
                            username,
                            institution
                        )
                    `)
                    .eq('author.institution', userInstitution);

                if (activeCategory !== "All Categories") {
                    const dbSlug = categoryMap[activeCategory];
                    if (dbSlug) {
                        query = query.eq('category', dbSlug);
                    }
                }

                if (sortOrder === "Price: Low to High") {
                    query = query.order('price', { ascending: true });
                } else if (sortOrder === "Price: High to Low") {
                    query = query.order('price', { ascending: false });
                } else {
                    query = query.order('created_at', { ascending: false });
                }

                const { data, error } = await query;

                if (error) throw error;
                setGigs(data || []);
            } catch (error) {
                console.error("Error fetching gigs:", error.message || error);
                if (error.details) console.error("Error details:", error.details);
                if (error.hint) console.error("Error hint:", error.hint);
            } finally {
                setLoading(false);
            }
        };

        fetchGigs();
    }, [supabase, activeCategory, sortOrder]);

    return (
        <div className="flex flex-col min-h-full bg-[#fcf6de] p-4 sm:p-8 pt-0 gap-6 max-w-[1200px] mx-auto w-full">

            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
                <div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-wide font-newyork text-gray-900">
                        Campus Gigs
                    </h1>
                    <p className="text-gray-600 font-medium mt-1 pl-1">
                        Find peer jobs or hire a student
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-[180px] hidden sm:block">
                        <CustomDropdown
                            options={CATEGORIES}
                            value={activeCategory}
                            onChange={setActiveCategory}
                        />
                    </div>
                    <div className="w-[180px] hidden sm:block">
                        <CustomDropdown
                            options={SORT_OPTIONS}
                            value={sortOrder}
                            onChange={setSortOrder}
                        />
                    </div>
                    {/* Mobile Filter Button Placeholders - Can expand later */}
                    <button
                        onClick={() => setIsMobileFilterOpen(true)}
                        className="sm:hidden bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm px-6 py-3 rounded-full transition-colors active:scale-95 shadow-sm flex items-center gap-2"
                    >
                        <HugeiconsIcon icon={FilterIcon} className="w-4 h-4" />
                        Filters
                    </button>
                    <Link
                        href="/dashboard/gigs/post"
                        className="bg-black hover:bg-gray-800 text-white font-semibold text-sm px-6 py-3 rounded-full transition-colors active:scale-95 shadow-sm flex items-center gap-2"
                    >
                        <HugeiconsIcon icon={PlusSignIcon} className="w-5 h-5" />
                        Post a Gig
                    </Link>
                </div>
            </div>

            {/* Featured Gigs Section (Keep static for now or pick first from live data) */}
            <div className="mt-6 mb-2">
                <h2 className="text-3xl font-black font-newyork text-gray-900 mb-4 tracking-tight">Featured Gigs</h2>

                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 border border-white/50 shadow-sm relative overflow-hidden">
                    {/* Left Card - Showing latest gig as featured or a placeholder if empty */}
                    {loading ? (
                        <div className="bg-[#fcfcfc] border-2 border-gray-100 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 w-full max-w-[450px] space-y-4 animate-pulse">
                            <div className="flex gap-4 items-start">
                                <div className="size-16 rounded-full bg-gray-200 shrink-0" />
                                <div className="flex-1 space-y-2 pt-2">
                                    <div className="h-5 w-32 bg-gray-200 rounded-full" />
                                    <div className="h-4 w-full bg-gray-200 rounded-full" />
                                    <div className="h-4 w-3/4 bg-gray-200 rounded-full" />
                                </div>
                            </div>
                        </div>
                    ) : gigs.length > 0 ? (
                        <div
                            onClick={() => router.push(`/dashboard/gigs/detail?id=${gigs[0].id}`)}
                            className="bg-[#fcfcfc] border-2 border-[#ffc107] rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 w-full max-w-[450px] shadow-sm relative z-10 cursor-pointer group"
                        >
                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                                {/* Desktop Sidebar: Avatar, Location, Date */}
                                <div className="hidden sm:flex flex-col items-center gap-2 w-[72px] shrink-0">
                                    <div className="w-[72px] h-[72px] rounded-full object-cover shadow-sm border border-gray-100 overflow-hidden relative">
                                        <Avatar
                                            src={gigs[0].author?.profile_picture}
                                            alt={gigs[0].author?.display_name || "Author"}
                                            size="full"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 text-[10px] font-medium leading-tight text-center">
                                        <div className="flex flex-col items-center gap-1 text-gray-500">
                                            <HugeiconsIcon icon={Location01Icon} className="w-4 h-4" />
                                            <span className="mt-1 font-bold text-gray-700">{gigs[0].location}</span>
                                        </div>
                                        {gigs[0].expected_due_date && (
                                            <div className="flex flex-col items-center gap-1 text-orange-500">
                                                <HugeiconsIcon icon={Calendar01Icon} className="w-4 h-4" />
                                                <span className="font-bold">Due {new Date(gigs[0].expected_due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col flex-1 w-full">
                                    {/* Mobile Header: Avatar + Name + Badge */}
                                    <div className="flex items-center gap-3 sm:hidden mb-3">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 shadow-sm shrink-0">
                                            <Avatar
                                                src={gigs[0].author?.profile_picture}
                                                alt={gigs[0].author?.display_name || "Author"}
                                                size="full"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 flex-1">
                                            <span className="text-[22px] font-black font-newyork text-gray-900 truncate max-w-[150px]">
                                                {gigs[0].author?.display_name?.split(' ')[0]}
                                            </span>
                                            <UserBadge 
                                                isAdmin={gigs[0].author?.is_admin} 
                                                isVerified={gigs[0].author?.is_verified} 
                                            />
                                        </div>
                                    </div>

                                    {/* Name & Price (Desktop view) */}
                                    <div className="hidden sm:flex items-center gap-2 w-full">
                                        <span className="text-[26px] font-black font-newyork text-gray-900 truncate max-w-[150px] group-hover:text-[#ffc107] transition-colors">
                                            {gigs[0].author?.display_name?.split(' ')[0]}
                                        </span>
                                        <UserBadge 
                                            isAdmin={gigs[0].author?.is_admin} 
                                            isVerified={gigs[0].author?.is_verified} 
                                        />
                                    </div>

                                    <span className="text-[22px] sm:text-[26px] font-black font-newyork text-gray-900 mt-0 sm:mt-3 flex items-center">
                                        <span className="text-[18px] sm:text-[22px] font-sans pr-1">¢</span>
                                        {gigs[0].price}
                                    </span>

                                    <p className="font-bold text-gray-900 text-[14px] sm:text-[15px] leading-[1.4] mt-2 sm:mt-5 pr-0 sm:pr-2 line-clamp-2">
                                        {gigs[0].title}
                                    </p>

                                    {/* Mobile Footer: Location & Date */}
                                    <div className="flex sm:hidden items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600">
                                            <HugeiconsIcon icon={Location01Icon} className="w-3.5 h-3.5" />
                                            {gigs[0].location}
                                        </div>
                                        {gigs[0].expected_due_date && (
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-orange-500">
                                                <HugeiconsIcon icon={Calendar01Icon} className="w-3.5 h-3.5" />
                                                Due {new Date(gigs[0].expected_due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                    ) : (
                        <div className="bg-[#fcfcfc] border-2 border-dashed border-gray-300 rounded-[2rem] p-10 w-full max-w-[450px] flex items-center justify-center text-gray-400 font-medium">
                            No gigs posted yet
                        </div>
                    )}

                    {/* Right Call to Action */}
                    <div className="flex flex-col items-center lg:items-start gap-4 sm:gap-8 max-w-[320px] md:pr-16 relative z-10 text-center lg:text-left mt-2 lg:mt-0">
                        <h3 className="text-[32px] sm:text-[42px] font-black font-newyork text-gray-900 leading-[1.1] sm:leading-[1.05] tracking-tight">
                            Create a Gig Today!
                        </h3>
                        <Link href="/dashboard/gigs/post" className="bg-[#ffc107] hover:bg-[#ffb300] text-gray-900 font-bold text-[14px] sm:text-[15px] px-6 sm:px-8 py-3 rounded-full transition-all flex items-center gap-2 sm:gap-3 shadow-sm active:scale-[0.98]">
                            Create now <span className="text-lg sm:text-xl">→</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Gigs List & Zero State */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4 pb-12">
                    {[...Array(6)].map((_, i) => <GigCardSkeleton key={i} />)}
                </div>
            ) : gigs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-60 px-6 bg-white rounded-[2rem] border border-gray-200 shadow-sm mt-4">
                    <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                        <HugeiconsIcon icon={Search01Icon} className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-black font-newyork text-gray-900">No gigs found</h3>
                    <p className="text-gray-500 font-bold mt-2 text-sm max-w-sm">No ones offering any gigs matching your filters. Try adjusting your category or post the first one!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                    {gigs.map((gig) => (
                        <div
                            key={gig.id}
                            className={`rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col gap-4 bg-white hover:shadow-md transition-shadow cursor-pointer`}
                        >
                            {/* Author Info */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 bg-gray-200 shrink-0 relative">
                                    <Avatar
                                        src={gig.author?.profile_picture}
                                        alt={gig.author?.display_name || "Author"}
                                        size="full"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900 text-sm">{gig.author?.display_name}</span>
                                        <UserBadge isAdmin={gig.author?.is_admin} isVerified={gig.author?.is_verified} size="sm" />
                                    </div>
                                    <span className="text-[11px] text-gray-500 font-medium">
                                        {new Date(gig.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="ml-auto font-black text-lg text-gray-900 bg-yellow-50 px-3 py-1 rounded-full">
                                    ¢{gig.price}
                                </div>
                            </div>

                            {/* Gig Content */}
                            <div className="flex flex-col gap-2 flex-grow">
                                <h3 className="text-xl font-bold text-gray-900 leading-tight">
                                    {gig.title}
                                </h3>
                                <p className="text-sm text-gray-700 line-clamp-3 font-medium">
                                    {gig.description}
                                </p>
                            </div>

                            {/* Tags and Location */}
                            <div className="flex flex-col gap-3 mt-2 pt-4 border-t border-black/5">
                                <div className="flex items-center gap-2 text-xs text-gray-600 font-semibold">
                                    <HugeiconsIcon icon={Location01Icon} className="w-4 h-4" />
                                    {gig.location}
                                </div>
                                {gig.expected_due_date && (
                                    <div className="flex items-center gap-2 text-xs text-orange-500 font-semibold">
                                        <HugeiconsIcon icon={Calendar01Icon} className="w-4 h-4" />
                                        Due {new Date(gig.expected_due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {gig.tags && gig.tags.map((tag, idx) => (
                                        <span key={idx} className="bg-gray-100 text-gray-800 text-[11px] font-bold px-3 py-1 rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-2">
                                <Link
                                    href={`/dashboard/gigs/detail?id=${gig.id}`}
                                    className="flex-1 bg-black text-white hover:bg-gray-800 text-sm font-semibold py-3 rounded-full transition-colors active:scale-95 shadow-sm text-center flex items-center justify-center"
                                >
                                    View Details
                                </Link>
                                {gig.author?.id !== currentUserId && (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/dashboard/chat/new?user=${gig.author.id}&gig=${gig.id}`);
                                            }}
                                            className="w-12 h-12 bg-white flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors shadow-sm border border-gray-100 shrink-0"
                                            title="Book Gig"
                                        >
                                            <HugeiconsIcon icon={Message01Icon} className="w-5 h-5 text-gray-700" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Mobile Filter Bottom Sheet */}
            {isMobileFilterOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:hidden bg-black/40 backdrop-blur-sm transition-opacity">
                    <div
                        className="bg-white w-full rounded-t-[2rem] p-6 pb-12 flex flex-col gap-6 animate-slide-up"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-2xl font-black font-newyork text-gray-900">Filters</h3>
                            <button
                                onClick={() => setIsMobileFilterOpen(false)}
                                className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-6 z-[60]">
                            <CustomDropdown
                                label="Category"
                                options={CATEGORIES}
                                value={activeCategory}
                                onChange={setActiveCategory}
                            />

                            <CustomDropdown
                                label="Sort Order"
                                options={SORT_OPTIONS}
                                value={sortOrder}
                                onChange={setSortOrder}
                            />
                        </div>

                        <button
                            onClick={() => setIsMobileFilterOpen(false)}
                            className="w-full mt-4 bg-[#ffc107] hover:bg-[#ffb300] text-gray-900 font-bold text-lg py-4 rounded-xl transition-colors shadow-sm"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Spacer to clear Bottom Nav */}
            <div className="h-32 w-full shrink-0"></div>
        </div>
    );
}
