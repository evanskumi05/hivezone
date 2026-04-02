"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    MoreHorizontalCircle01Icon,
    Delete02Icon,
    Alert01Icon,
    FavouriteIcon,
    Comment01Icon,
    Image01Icon,
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
    const { showImage } = useUI();
    const menuRef = useRef(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMediaLoaded, setIsMediaLoaded] = useState(false);

    useEffect(() => {
        if (post.media_url && !isMediaLoaded) {
            const timer = setTimeout(() => {
                setIsMediaLoaded(true);
            }, 3000); 
            return () => clearTimeout(timer);
        }
    }, [post.media_url, isMediaLoaded]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
        <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-4 sm:p-6 flex gap-4 mb-1">
            {/* Left: Avatar */}
            <Link
                href={`/dashboard/profile/${post.author?.username || post.user_id}`}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 shrink-0 block rounded-full"
            >
                <Avatar
                    src={post.author?.profile_picture}
                    name={post.author?.display_name || post.author?.first_name}
                    className="w-full h-full rounded-full"
                />
            </Link>

            {/* Right: Content */}
            <div className="flex-1 flex flex-col gap-2 min-w-0">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-x-2 gap-y-1 flex-wrap min-w-0">
                        <Link href={`/dashboard/feed/${post.id}`} className="font-bold text-gray-900 text-[17px] hover:text-[#ffc107] transition-colors truncate">
                            {post.author?.display_name || post.author?.first_name}
                        </Link>
                        <UserBadge isAdmin={post.author?.is_admin} isVerified={post.author?.is_verified} />
                        <span className="text-gray-400 text-[15px] truncate max-w-[100px]">@{post.author?.username || 'user'}</span>
                        <span className="text-gray-300">.</span>
                        <span className="text-gray-400 text-[14px] shrink-0">{formatDate(post.created_at)}</span>
                    </div>

                    <div className="relative shrink-0">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                        >
                            <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="w-5 h-5" />
                        </button>

                        {isMenuOpen && (
                            <div
                                ref={menuRef}
                                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200"
                            >
                                {profile?.id === post.user_id ? (
                                    <button
                                        onClick={() => { setIsMenuOpen(false); onDelete(post.id, post.media_url); }}
                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
                                    >
                                        <HugeiconsIcon icon={Delete02Icon} className="w-4 h-4" />
                                        Delete Post
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => { setIsMenuOpen(false); onReport(post); }}
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
                    <div className="relative w-full aspect-[4/5] sm:aspect-square md:aspect-[4/5] rounded-[1.2rem] overflow-hidden mt-2 cursor-pointer group/img bg-black shadow-sm border border-gray-100/50 flex items-center justify-center">
                        {!isMediaLoaded && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10 transition-opacity duration-300">
                                <HugeiconsIcon icon={Image01Icon} className="w-8 h-8 text-gray-300" />
                            </div>
                        )}
                        {post.media_url.match(/\.(mp4|webm|ogg|mov|m4v|3gp|mkv)$/i) ? (
                            <AutoPauseVideo
                                src={post.media_url}
                                className="w-full h-full object-contain relative z-20"
                                onClick={() => showImage(post.media_url)}
                            />
                        ) : (
                            <img
                                src={feedImageUrl(post.media_url)}
                                alt="Post media"
                                onClick={() => showImage(fullImageUrl(post.media_url))}
                                onLoad={() => setIsMediaLoaded(true)}
                                onError={(e) => {
                                    if (e.target.src !== post.media_url) {
                                        e.target.src = post.media_url;
                                    } else {
                                        setIsMediaLoaded(true);
                                    }
                                }}
                                loading="lazy"
                                className={`w-full h-full object-contain transition-all duration-700 bg-black group-hover/img:scale-[1.01] ${isMediaLoaded ? 'opacity-100 scale-100 blur-0 relative z-20' : 'opacity-0 scale-105 blur-xl absolute inset-0'}`}
                            />
                        )}
                    </div>
                )}

                <div className="flex items-center gap-8 mt-4 pt-4 border-t border-gray-50">
                    <button
                        onClick={() => onLike(post)}
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
