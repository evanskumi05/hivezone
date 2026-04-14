"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    MoreHorizontalCircle01Icon,
    Delete02Icon,
    Alert01Icon,
    FavouriteIcon,
    Comment01Icon,
} from "@hugeicons/core-free-icons";
import UserBadge from "@/components/ui/UserBadge";
import Avatar from "@/components/ui/Avatar";
import AutoPauseVideo from "@/components/ui/AutoPauseVideo";
import { useUI } from "@/components/ui/UIProvider";
import Linkify from "@/components/ui/Linkify";
import { feedImageUrl, fullImageUrl } from "@/utils/optimizeImage";

export default React.memo(function FeedPostCard({
    post,
    profile,
    onDelete,
    onReport,
    onLike
}) {
    const router = useRouter();
    const { showImage } = useUI();
    const menuRef = useRef(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        if (!isMenuOpen) return;

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMenuOpen]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        if (diffInSeconds < 60) return `${diffInSeconds}sec ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div 
            onClick={() => router.push(`/dashboard/feed/${post.id}`)}
            className="bg-[#fcf6de] border-b border-gray-200/60 p-4 sm:p-6 flex gap-4 will-change-transform cursor-pointer group/card hover:bg-[#fcf6de]/50 transition-colors"
        >
            {/* Left: Avatar */}
            <Link
                href={`/dashboard/profile/${post.author?.username || post.user_id}`}
                onClick={(e) => e.stopPropagation()}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 shrink-0 block rounded-full overflow-hidden"
            >
                <Avatar
                    src={post.author?.profile_picture}
                    name={post.author?.display_name || post.author?.first_name}
                    className="w-full h-full object-cover"
                />
            </Link>

            {/* Right: Content */}
            <div className="flex-1 flex flex-col gap-2 min-w-0">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-x-2 gap-y-1 flex-wrap min-w-0">
                        <Link 
                            href={`/dashboard/profile/${post.author?.username || post.user_id}`} 
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-gray-900 text-[17px] hover:text-[#ffc107] transition-colors truncate"
                        >
                            {post.author?.display_name || post.author?.first_name}
                        </Link>
                        <UserBadge isAdmin={post.author?.is_admin} isVerified={post.author?.is_verified} />
                        <span className="text-gray-400 text-[15px] truncate max-w-[100px]">@{post.author?.username || 'user'}</span>
                        <span className="text-gray-300">.</span>
                        <span className="text-gray-400 text-[14px] shrink-0">{formatDate(post.created_at)}</span>
                    </div>

                    <div className="relative shrink-0">
                        {post.is_ghost ? (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                                <div className="w-1.5 h-1.5 bg-[#ffc107] rounded-full animate-pulse" />
                                <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Sending</span>
                            </div>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                            >
                                <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="w-5 h-5" />
                            </button>
                        )}

                        {isMenuOpen && (
                            <div
                                ref={menuRef}
                                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200"
                            >
                                {profile?.id === post.user_id ? (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); onDelete(post.id, post.media_url); }}
                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
                                    >
                                        <HugeiconsIcon icon={Delete02Icon} className="w-4 h-4" />
                                        Delete Post
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); onReport(post); }}
                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-orange-600 hover:bg-orange-50"
                                    >
                                        <HugeiconsIcon icon={Alert01Icon} className="w-4 h-4" />
                                        Report Post
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <Link href={`/dashboard/feed/${post.id}`} className="block">
                    {post.content && (
                        <div className="mb-2">
                            <Linkify 
                                text={post.content} 
                                className="text-gray-900 text-[17px] leading-[1.5] break-words" 
                            />
                        </div>
                    )}
                </Link>

                {post.media_url && (
                    <div className="relative w-full aspect-[4/5] rounded-[1.5rem] overflow-hidden mt-3 bg-gray-50 border border-gray-100 shadow-inner group/img">
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 animate-pulse" />
                        {post.media_url.match(/\.(mp4|webm|ogg|mov|m4v|3gp|mkv)$/i) ? (
                            <AutoPauseVideo
                                src={post.media_url}
                                poster={post.thumbnail_url}
                                onClick={(e) => { e.stopPropagation(); showImage(post.media_url); }}
                            />
                        ) : (
                            <img
                                src={feedImageUrl(post.media_url)}
                                alt="Post media"
                                onClick={(e) => { e.stopPropagation(); showImage(fullImageUrl(post.media_url)); }}
                                onError={(e) => {
                                    if (e.target.src !== post.media_url) e.target.src = post.media_url;
                                }}
                                className="relative z-10 w-full h-full object-cover group-hover/img:scale-[1.03] transition-transform duration-500"
                            />
                        )}
                    </div>
                )}

                <div className="flex items-center gap-8 mt-4 pt-4 border-t border-gray-50">
                    <button
                        onClick={(e) => { e.stopPropagation(); onLike(post); }}
                        className={`flex items-center gap-2 group ${post.is_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                    >
                        <div className="w-9 h-9 flex items-center justify-center rounded-full group-hover:bg-red-50 transition-colors">
                            <HugeiconsIcon
                                icon={FavouriteIcon}
                                className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`}
                            />
                        </div>
                        <span className="text-[14px] font-bold">{post.likes_count || 0}</span>
                    </button>

                    <Link
                        href={`/dashboard/feed/${post.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 group text-gray-500 hover:text-amber-500"
                    >
                        <div className="w-9 h-9 flex items-center justify-center rounded-full group-hover:bg-amber-50 transition-colors">
                            <HugeiconsIcon icon={Comment01Icon} className="w-5 h-5" />
                        </div>
                        <span className="text-[14px] font-bold">{post.comments_count || 0}</span>
                    </Link>
                </div>
            </div>
        </div>
    );
});
