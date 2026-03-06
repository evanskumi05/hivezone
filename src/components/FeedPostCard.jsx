"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    CheckmarkBadge01Icon,
    MoreHorizontalCircle01Icon,
    Delete02Icon,
    Alert01Icon,
    FavouriteIcon,
    Comment01Icon
} from "@hugeicons/core-free-icons";
import Avatar from "@/components/ui/Avatar";
import AutoPauseVideo from "@/components/ui/AutoPauseVideo";
import { useUI } from "@/components/ui/UIProvider";

export default function FeedPostCard({
    post,
    profile,
    supabase,
    onDelete,
    onReport,
    onLike,
    activeCommentId,
    toggleComments,
    commentsData,
    commentInputs,
    setCommentInputs,
    handleCommentSubmit,
    handleDeleteComment,
    loadingComments
}) {
    const { showImage } = useUI();
    const menuRef = useRef(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Close menu when clicking outside
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
        <div
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 flex gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
            {/* Left: Avatar */}
            <Link
                href={`/dashboard/profile/${post.author?.username || post.user_id}`}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 shrink-0 block rounded-full"
            >
                <Avatar
                    src={post.author?.profile_picture}
                    name={post.author?.display_name || "Author"}
                    className="w-full h-full rounded-full"
                />
            </Link>

            {/* Right: Content */}
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                {/* Post Header */}
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-x-2 gap-y-1 flex-wrap min-w-0">
                        <span className="font-bold text-gray-900 text-[16px]">
                            {post.author?.display_name || 'Anonymous'}
                        </span>
                        {post.author?.is_verified && (
                            <HugeiconsIcon icon={CheckmarkBadge01Icon} className="w-4 h-4 text-green-500 shrink-0" strokeWidth={2.5} />
                        )}
                        <span className="text-gray-500 text-[15px]">@{post.author?.username || 'user'}</span>
                        <span className="text-[#ffc107] font-bold text-xl leading-none px-1 relative -top-1">.</span>
                        <span className="text-gray-500 text-[15px] shrink-0 font-medium">{formatDate(post.created_at)}</span>
                    </div>

                    {/* 3-Dot Menu */}
                    <div className="relative shrink-0">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="w-5 h-5" strokeWidth={2} />
                        </button>

                        {isMenuOpen && (
                            <div
                                ref={menuRef}
                                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden animate-in fade-in zoom-in duration-200"
                            >
                                {profile?.id === post.user_id ? (
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            onDelete(post.id, post.media_url);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <HugeiconsIcon icon={Delete02Icon} className="w-4 h-4" strokeWidth={2} />
                                        Delete Post
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            onReport(post);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-orange-600 hover:bg-orange-50 transition-colors"
                                    >
                                        <HugeiconsIcon icon={Alert01Icon} className="w-4 h-4" strokeWidth={2} />
                                        Report Post
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Post Text */}
                {post.content && (
                    <p className="text-gray-900 text-[16px] leading-[1.4] font-regular break-words pr-2">
                        {post.content}
                    </p>
                )}

                {post.media_url && (
                    <div className="w-full rounded-xl overflow-hidden mt-3 cursor-pointer group/img bg-black shadow-sm border border-gray-100/50">
                        {post.media_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                            <AutoPauseVideo
                                src={post.media_url}
                                className="w-full max-h-[250px] sm:max-h-[600px] object-contain"
                                onClick={() => showImage(post.media_url)}
                            />
                        ) : (
                            <img
                                src={post.media_url}
                                alt="Post media"
                                onClick={() => showImage(post.media_url)}
                                className="w-full max-h-[250px] sm:max-h-[600px] object-cover transition-transform duration-500 group-hover/img:scale-[1.02]"
                            />
                        )}
                    </div>
                )}

                {/* Interaction Bar */}
                <div className="flex items-center justify-between mt-4 py-3 border-t border-gray-50">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => onLike(post)}
                            className={`flex items-center gap-2 group transition-all duration-300 ${post.is_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                        >
                            <div className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors group-hover:bg-red-50`}>
                                <HugeiconsIcon
                                    icon={FavouriteIcon}
                                    className={`w-5 h-5 transition-transform duration-300 group-active:scale-125 ${post.is_liked ? 'fill-current' : ''}`}
                                />
                            </div>
                            <span className="text-[14px] font-bold">{post.likes_count || 0}</span>
                        </button>

                        <button
                            onClick={() => toggleComments(post.id)}
                            className={`flex items-center gap-2 group transition-all ${activeCommentId === post.id ? 'text-[#ffc107]' : 'text-gray-500 hover:text-[#ffc107]'}`}
                        >
                            <div className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${activeCommentId === post.id ? 'bg-amber-50' : 'group-hover:bg-amber-50'}`}>
                                <HugeiconsIcon icon={Comment01Icon} className="w-5 h-5" />
                            </div>
                            <span className="text-[14px] font-bold">{post.comments_count || 0}</span>
                        </button>
                    </div>
                </div>

                {/* Comments Section */}
                {activeCommentId === post.id && (
                    <div className="mt-2 border-t border-gray-50 pt-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Comment List */}
                        <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto px-1 custom-scrollbar">
                            {loadingComments[post.id] ? (
                                <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#ffc107]"></div>
                                </div>
                            ) : commentsData[post.id]?.length > 0 ? (
                                commentsData[post.id].map(comment => (
                                    <div key={comment.id} className="flex gap-3">
                                        <Avatar
                                            src={comment.author?.profile_picture}
                                            name={comment.author?.display_name}
                                            className="w-8 h-8 rounded-full shrink-0"
                                        />
                                        <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-2">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-xs text-gray-900">{comment.author?.display_name}</span>
                                                    <span className="text-[10px] text-gray-400 font-medium">{formatDate(comment.created_at)}</span>
                                                </div>
                                                {profile?.id === comment.user_id && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.id, post.id)}
                                                        className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <HugeiconsIcon icon={Delete02Icon} size={12} strokeWidth={2.5} />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-800 break-words">{comment.content}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-400 text-sm py-4">No comments yet. Be the first!</p>
                            )}
                        </div>

                        {/* Comment Input */}
                        <div className="flex gap-3 items-center">
                            <Avatar
                                src={profile?.profile_picture}
                                name={profile?.display_name || "User"}
                                className="w-8 h-8 rounded-full shrink-0"
                            />
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Write a comment..."
                                    value={commentInputs[post.id] || ""}
                                    onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleCommentSubmit(post.id);
                                    }}
                                    className="w-full bg-gray-100 border-none outline-none rounded-2xl py-2 px-4 text-sm text-gray-800 placeholder:text-gray-400 pr-10"
                                />
                                <button
                                    onClick={() => handleCommentSubmit(post.id)}
                                    disabled={!commentInputs[post.id]?.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#ffc107] hover:text-[#ffca2c] disabled:opacity-50 transition-colors"
                                >
                                    <HugeiconsIcon icon={Comment01Icon} size={18} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
