"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { getOrCreateConversation } from "@/utils/chat";
import { useUI } from "@/components/ui/UIProvider";
import Avatar from "@/components/ui/Avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import Skeleton from "@/components/ui/Skeleton";
import {
    ArrowLeft01Icon,
    Wallet01Icon,
    Message01Icon,
    Location01Icon,
    Time01Icon,
    MoreHorizontalCircle01Icon,
    Briefcase02Icon,
    CheckmarkBadge01Icon,
    Delete02Icon,
    Alert02Icon
} from "@hugeicons/core-free-icons";

function GigDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const gid = searchParams.get("id");
    const supabase = createClient();
    const { confirmAction, showToast } = useUI();
    const menuRef = useRef(null);

    const [gig, setGig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [showMenu, setShowMenu] = useState(false);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!gid) return;

        const fetchGigDetails = async () => {
            setLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) setCurrentUserId(session.user.id);

                const { data, error } = await supabase
                    .from('gigs')
                    .select(`
                        *,
                        author:users (
                            id,
                            display_name,
                            profile_picture,
                            is_verified,
                            programme,
                            year_of_study,
                            username
                        )
                    `)
                    .eq('id', gid)
                    .single();

                if (error) throw error;
                setGig(data);
            } catch (error) {
                console.error("Error fetching gig:", error.message || error);
                if (error.details) console.error("Error details:", error.details);
                if (error.hint) console.error("Error hint:", error.hint);
            } finally {
                setLoading(false);
            }
        };

        fetchGigDetails();
    }, [gid, supabase]);

    const handleDeleteGig = async () => {
        const confirmed = await confirmAction({
            title: "Delete Gig?",
            message: "Are you sure you want to remove this gig? This action cannot be undone.",
            confirmText: "Delete",
            cancelText: "Cancel",
            type: "danger"
        });

        if (!confirmed) return;

        try {
            // Delete gig image from storage if it exists
            if (gig.image_url) {
                try {
                    const bucketName = 'gigs';
                    const url = new URL(gig.image_url);
                    const filenameFromUrl = decodeURIComponent(url.pathname).split('/').pop().split('?')[0];
                    const folderPath = 'gig-images';

                    const { data: files } = await supabase.storage.from(bucketName).list(folderPath);
                    const matchingFile = files?.find(f => f.name === filenameFromUrl);

                    if (matchingFile) {
                        const filePath = `${folderPath}/${matchingFile.name}`;
                        await supabase.storage.from(bucketName).remove([filePath]);
                    }
                } catch (e) {
                    console.error("Storage cleanup error:", e);
                }
            }

            // Delete gig from DB
            const { error: deleteError } = await supabase
                .from('gigs')
                .delete()
                .eq('id', gig.id)
                .eq('user_id', currentUserId);

            if (deleteError) throw deleteError;

            showToast("Gig deleted successfully!", "success");
            router.push("/dashboard/gigs");

        } catch (error) {
            console.error("Error deleting gig:", error);
            showToast("Failed to delete gig. Please try again.", "error");
        }
    };

    const handleReportGig = () => {
        showToast("Gig reported to administrators", "success");
        setShowMenu(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fcf6de] pt-4 pb-20 md:pb-8">
                <div className="max-w-5xl mx-auto px-4 md:px-8">
                    <Skeleton className="h-8 w-24 rounded-full mb-8" />
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="flex-1 space-y-5">
                            <Skeleton className="h-8 w-3/4 rounded-full" />
                            <Skeleton className="h-4 w-full rounded-full" />
                            <Skeleton className="h-4 w-5/6 rounded-full" />
                            <Skeleton className="h-4 w-2/3 rounded-full" />
                            <div className="flex gap-4 pt-2">
                                <Skeleton className="h-10 w-24 rounded-full" />
                                <Skeleton className="h-10 w-24 rounded-full" />
                            </div>
                        </div>
                        <div className="w-full lg:w-80 space-y-4">
                            <Skeleton className="h-14 w-full rounded-[1.5rem]" />
                            <Skeleton className="h-14 w-full rounded-[1.5rem]" />
                            <Skeleton className="h-40 w-full rounded-[2rem]" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!gig) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#fcf6de] text-gray-500">
                <p className="text-xl font-bold">Gig not found</p>
                <button onClick={() => router.back()} className="mt-4 text-[#ffc107] font-bold">Go back</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#fcf6de] p-4 sm:p-8 pt-0 gap-6 max-w-[1000px] mx-auto w-full">

            {/* Header / Nav */}
            <div className="flex items-center justify-between mt-4 relative">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5 text-gray-700" />
                </button>

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="w-5 h-5 text-gray-700" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-12 bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl py-2 w-48 z-50 overflow-hidden isolate" style={{ animation: 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                            {currentUserId === gig.author?.id ? (
                                <button
                                    onClick={handleDeleteGig}
                                    className="w-full text-left px-5 py-3 text-[14px] text-red-600 font-bold hover:bg-red-50 transition-colors flex items-center gap-3"
                                >
                                    <HugeiconsIcon icon={Delete02Icon} className="w-4 h-4" />
                                    Delete Gig
                                </button>
                            ) : (
                                <button
                                    onClick={handleReportGig}
                                    className="w-full text-left px-5 py-3 text-[14px] text-gray-700 font-bold hover:bg-gray-50 transition-colors flex items-center gap-3"
                                >
                                    <HugeiconsIcon icon={Alert02Icon} className="w-4 h-4" />
                                    Report Gig
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 mt-2">

                {/* Left Column: Gig Insights */}
                <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col gap-6">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                        <span className="bg-[#ffc107]/20 text-orange-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                            Open Gig
                        </span>
                        {gig.tags?.map((tag, idx) => (
                            <span key={idx} className="bg-gray-50 border border-gray-100 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Title & Desc */}
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-4 font-newyork tracking-tight">
                            {gig.title}
                        </h1>
                        <p className="text-gray-700 leading-relaxed font-medium text-[15px] whitespace-pre-wrap">
                            {gig.description}
                        </p>
                    </div>

                    {/* Image Display */}
                    {gig.image_url && (
                        <div className="w-full h-[400px] bg-gray-100 rounded-[1.5rem] border border-gray-200 flex items-center justify-center mt-2 overflow-hidden shadow-sm">
                            <img
                                src={gig.image_url}
                                alt="Gig Reference"
                                className="w-full h-full object-cover transition-transform hover:scale-[1.02] duration-500"
                            />
                        </div>
                    )}
                </div>

                {/* Right Column: Checkout & Author */}
                <div className="flex flex-col gap-6">

                    {/* Action Card */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex items-center gap-2 text-gray-400 font-extrabold text-[10px] mb-1 uppercase tracking-[0.2em]">
                            <HugeiconsIcon icon={Wallet01Icon} className="w-4 h-4" />
                            Gig Budget
                        </div>
                        <div className="text-5xl font-black text-gray-900 mb-6 font-newyork flex items-baseline">
                            <span className="text-2xl pr-1 font-sans">¢</span>{gig.price}
                        </div>

                        <div className="flex flex-col gap-3 py-4 border-y border-gray-100 mb-6">
                            <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                                <HugeiconsIcon icon={Time01Icon} className="w-4 h-4 text-gray-400" />
                                Posted {new Date(gig.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                                <HugeiconsIcon icon={Location01Icon} className="w-4 h-4 text-gray-400" />
                                {gig.location}
                            </div>
                            <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                                <HugeiconsIcon icon={Briefcase02Icon} className="w-4 h-4 text-gray-400" />
                                <span className="capitalize">{gig.category}</span>
                            </div>
                        </div>

                        {currentUserId === gig.author?.id ? (
                            /* User is the gig owner — show edit option instead */
                            <div className="w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-[1.5rem] p-5 flex flex-col items-center text-center gap-2">
                                <span className="text-[13px] font-bold text-gray-400 uppercase tracking-widest">Your Gig</span>
                                <p className="text-sm font-medium text-gray-500">This gig belongs to you — you can't book it.</p>
                                <button
                                    onClick={() => router.push(`/dashboard/gigs/edit?id=${gig.id}`)}
                                    className="mt-2 w-full px-5 py-3 rounded-full bg-black text-white text-[15px] font-bold shadow-sm hover:bg-zinc-800 transition-colors"
                                >
                                    Edit This Gig
                                </button>
                                <button
                                    onClick={() => router.back()}
                                    className="w-full px-5 py-2.5 rounded-full border border-gray-200 text-sm font-bold text-gray-700 hover:bg-white transition-colors mt-2"
                                >
                                    Go Back
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={async () => {
                                        try {
                                            const chatId = await getOrCreateConversation(gig.author.id, gig.id);
                                            router.push(`/dashboard/chat/${chatId}`);
                                        } catch (err) {
                                            console.error("Error starting chat:", err);
                                        }
                                    }}
                                    className="w-full bg-[#ffc107] hover:bg-[#ffca2c] text-black font-black text-lg py-4 rounded-[1.5rem] transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 mb-3"
                                >
                                    Book this Gig
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            const chatId = await getOrCreateConversation(gig.author.id, gig.id);
                                            router.push(`/dashboard/chat/${chatId}`);
                                        } catch (err) {
                                            console.error("Error starting chat:", err);
                                        }
                                    }}
                                    className="w-full bg-white border-2 border-gray-100 hover:border-black hover:bg-gray-50 text-black font-bold text-lg py-3.5 rounded-[1.5rem] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <HugeiconsIcon icon={Message01Icon} className="w-5 h-5" />
                                    Negotiate
                                </button>
                            </>
                        )}
                    </div>

                    {/* Author Card */}
                    <div className="bg-[#fde68a] rounded-[2rem] p-6 shadow-sm border border-[#ffca2c] flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none"></div>

                        <h3 className="text-[10px] font-black text-[#926002] uppercase tracking-[0.2em] mb-4">About the Client</h3>

                        <div className="flex gap-4 items-center">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/50 bg-white shrink-0 shadow-sm relative">
                                <Avatar
                                    src={gig.author?.profile_picture}
                                    alt={gig.author?.display_name || "Author"}
                                    size="full"
                                />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-gray-900 text-lg leading-tight">{gig.author?.display_name}</span>
                                    {gig.author?.is_verified && <HugeiconsIcon icon={CheckmarkBadge01Icon} className="w-4 h-4 text-green-600" />}
                                </div>
                                <span className="text-[11px] text-gray-800 font-bold opacity-80">{gig.author?.programme || "Student"}</span>
                                <span className="text-[10px] text-gray-700 font-bold opacity-60 uppercase tracking-wider">{gig.author?.year_of_study || "Campus"}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                if (gig.author?.username) {
                                    router.push(`/dashboard/profile/${gig.author.username}`);
                                } else {
                                    // Fallback if no username exists
                                    router.push(`/dashboard/profile`);
                                }
                            }}
                            className="w-full mt-5 bg-white/40 hover:bg-white text-gray-900 border border-white/50 font-black text-xs py-3 rounded-full transition-all active:scale-95 shadow-sm uppercase tracking-wider"
                        >
                            View Public Profile
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default function GigDetailPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen bg-[#fcf6de]">
                <div className="w-12 h-12 border-4 border-[#ffc107]/30 border-t-[#ffc107] rounded-full animate-spin" />
            </div>
        }>
            <GigDetailContent />
        </Suspense>
    );
}
