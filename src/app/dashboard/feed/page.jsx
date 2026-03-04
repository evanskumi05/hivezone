"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useUI } from "@/components/ui/UIProvider";
import { HugeiconsIcon } from "@hugeicons/react";
import { FeedPostSkeleton } from "@/components/ui/Skeleton";
import Avatar from "@/components/ui/Avatar";
import {
    CheckmarkBadge01Icon,
    MoreHorizontalCircle01Icon,
    Image01Icon,
    Attachment01Icon,
    ArrowLeft01Icon,
    Cancel01Icon,
    Delete02Icon
} from "@hugeicons/core-free-icons";
import AutoPauseVideo from "@/components/ui/AutoPauseVideo";

export default function DedicatedFeedPage() {
    const { showToast, confirmAction, showImage } = useUI();
    const [posts, setPosts] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const limit = 20;

    const [postContent, setPostContent] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaType, setMediaType] = useState("image"); // 'image' or 'video'
    const [openMenuId, setOpenMenuId] = useState(null);
    const fileInputRef = useRef(null);
    const menuRef = useRef(null);
    const supabase = createClient();

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchPosts = async (pageNumber = 0, isInitial = false, userInstitution = null) => {
        try {
            if (isInitial) setLoading(true);
            else setLoadingMore(true);

            // Use the passed userInstitution or fallback to the state
            const targetInstitution = userInstitution || profile?.institution;

            // If we somehow still don't have an institution, just exit gracefully
            if (!targetInstitution) return;

            const from = pageNumber * limit;
            const to = from + limit - 1;

            const { data: feedsData, error } = await supabase
                .from("feeds")
                .select(`
                    *,
                    author:users!inner (
                        display_name,
                        username,
                        profile_picture,
                        is_verified,
                        institution
                    )
                `)
                .eq('author.institution', targetInstitution)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            if (feedsData) {
                if (isInitial) {
                    setPosts(feedsData);
                } else {
                    setPosts(prev => [...prev, ...feedsData]);
                }

                // If we got fewer records than the limit, we've reached the end
                if (feedsData.length < limit) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }
            }
        } catch (error) {
            console.error("Error fetching feeds:", error);
            showToast("Failed to load feeds.", "error");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            let currentUserInstitution = null;

            if (session) {
                const { data: profileData } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", session.user.id)
                    .single();
                setProfile(profileData);
                currentUserInstitution = profileData?.institution;
            }

            if (currentUserInstitution) {
                await fetchPosts(0, true, currentUserInstitution);
            } else {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [supabase]);

    // Intersection Observer for Infinite Scroll
    const observerTarget = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
                    setPage(prev => {
                        const nextPage = prev + 1;
                        fetchPosts(nextPage, false);
                        return nextPage;
                    });
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore, loading, loadingMore]);

    const handleMediaSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check size (30MB limit)
            const fileSizeMB = file.size / (1024 * 1024);
            if (fileSizeMB > 30) {
                showToast("File size must be less than 30MB.", "error");
                e.target.value = ""; // reset input
                return;
            }

            const isVideo = file.type.startsWith("video/");
            setMediaType(isVideo ? "video" : "image");
            setSelectedMedia(file);
            setMediaPreview(URL.createObjectURL(file));
        }
    };

    const handlePost = async () => {
        if (!postContent.trim() && !selectedMedia) return;
        setIsPosting(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            let url = null;

            if (selectedMedia) {
                const fileExt = selectedMedia.name.split('.').pop();
                const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
                const filePath = `post-media/${fileName}`; // Keep it all in the feed bucket under post-media

                const { error: uploadError } = await supabase.storage
                    .from('feeds')
                    .upload(filePath, selectedMedia);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('feeds')
                    .getPublicUrl(filePath);

                url = urlData.publicUrl;
            }

            const { data: newPost, error: postError } = await supabase
                .from('feeds')
                .insert([{
                    user_id: session.user.id,
                    content: postContent,
                    media_url: url
                }])
                .select(`
                    *,
                    author:users!inner (
                        display_name,
                        username,
                        profile_picture,
                        is_verified,
                        institution
                    )
                `)
                .single();

            if (postError) throw postError;

            setPosts([newPost, ...posts]);
            setPostContent("");
            setSelectedMedia(null);
            setMediaPreview(null);

        } catch (error) {
            console.error("Error creating post:", error);
            showToast("Failed to create post. Please try again.", "error");
        } finally {
            setIsPosting(false);
        }
    };

    const handleDeletePost = async (postId, mediaUrl) => {
        const confirmed = await confirmAction({
            title: "Delete Post?",
            message: "This post will be permanently removed from the hive. Are you sure?",
            confirmText: "Delete",
            cancelText: "Keep Post",
            type: "danger"
        });

        if (!confirmed) return;

        try {
            if (mediaUrl) {
                try {
                    const bucketName = 'feeds';
                    const urlObj = new URL(mediaUrl);
                    const filenameFromUrl = decodeURIComponent(urlObj.pathname).split('/').pop().split('?')[0];
                    const folderPath = mediaUrl.includes('post-images') ? 'post-images' : 'post-media';

                    const { data: files } = await supabase.storage.from(bucketName).list(folderPath);
                    const matchingFile = files?.find(f => f.name === filenameFromUrl);

                    if (matchingFile) {
                        const filePath = `${folderPath}/${matchingFile.name}`;

                        const { error: storageError } = await supabase.storage
                            .from(bucketName)
                            .remove([filePath]);

                        if (storageError) {
                            console.error("Storage cleanup failed:", storageError);
                        }
                    }
                } catch (e) {
                    console.error("Cleanup failed:", e);
                }
            }

            const { error: postError } = await supabase
                .from('feeds')
                .delete()
                .eq('id', postId);

            if (postError) throw postError;

            setPosts(posts.filter(p => p.id !== postId));
            setOpenMenuId(null);
            showToast("Post deleted successfully!");

        } catch (error) {
            console.error("Error deleting post:", error);
            showToast("Failed to delete post. Please try again.", "error");
        }
    };

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
        <div className="flex flex-col h-full bg-[#fcf6de] p-4 sm:p-8 pt-0 gap-4 max-w-[800px] mx-auto w-full min-h-screen overflow-x-hidden">

            {/* Header */}
            <div className="flex items-center gap-4 mt-4 mb-4 sticky top-0 z-10 bg-[#fcf6de]/95 backdrop-blur py-4 border-b border-gray-100/50">
                <Link
                    href="/dashboard"
                    className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5 text-gray-700" />
                </Link>
                <h1 className="text-2xl sm:text-3xl font-black tracking-wide font-newyork text-gray-900 leading-none">
                    Campus Feed
                </h1>
            </div>

            {/* Create Post Input Component */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col mb-4">
                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-gray-50 shrink-0 block rounded-full">
                        <Avatar
                            src={profile?.profile_picture}
                            name="Current User"
                            className="w-full h-full rounded-full"
                        />
                    </div>

                    <div className="flex-1">
                        <textarea
                            placeholder="What's happening on campus?"
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            className="w-full bg-transparent border-none outline-none resize-none text-gray-800 placeholder:text-gray-400 font-bold text-[18px] pt-3 min-h-[60px]"
                        ></textarea>

                        {mediaPreview && (
                            <div className="relative mt-2 mb-2 inline-block">
                                {mediaType === "video" ? (
                                    <video src={mediaPreview} controls className="max-h-60 rounded-xl" />
                                ) : (
                                    <img src={mediaPreview} alt="Preview" className="max-h-60 rounded-xl" />
                                )}
                                <button
                                    onClick={() => { setSelectedMedia(null); setMediaPreview(null); }}
                                    className="absolute -top-3 -right-3 bg-black text-white rounded-full p-1.5 shadow-md hover:scale-110 transition-transform"
                                >
                                    <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between mt-2 pl-[4.5rem]">
                    <div className="flex items-center gap-3">
                        <input type="file" ref={fileInputRef} onChange={handleMediaSelect} accept="image/*,video/*" className="hidden" />
                        <button
                            onClick={() => fileInputRef.current.click()}
                            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-black transition-colors border border-gray-100"
                        >
                            <HugeiconsIcon icon={Attachment01Icon} className="w-5 h-5" strokeWidth={2} />
                        </button>
                    </div>
                    <button
                        onClick={handlePost}
                        disabled={isPosting || (!postContent.trim() && !selectedMedia)}
                        className={`bg-[#ffc107] hover:bg-[#ffca2c] text-black font-bold text-[15px] px-6 py-1.5 rounded-full transition-all active:scale-95 shadow-sm ${isPosting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isPosting ? 'Posting...' : 'Post'}
                    </button>
                </div>
            </div>

            {/* Feed Stream */}
            <div className="flex flex-col gap-2 pb-4">
                {loading ? (
                    <div className="flex flex-col gap-5">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                                <FeedPostSkeleton />
                            </div>
                        ))}
                    </div>
                ) : posts.length > 0 ? (
                    posts.map(post => (
                        <div
                            key={post.id}
                            className={`bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-5 flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700`}
                        >
                            {/* Left: Avatar */}
                            <Link
                                href={`/dashboard/profile/${post.author?.username || post.user_id}`}
                                className="w-12 h-12 bg-gray-50 shrink-0 block rounded-full"
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
                                            onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                                            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                                        >
                                            <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="w-5 h-5" strokeWidth={2} />
                                        </button>

                                        {openMenuId === post.id && (
                                            <div
                                                ref={menuRef}
                                                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden animate-in fade-in zoom-in duration-200"
                                            >
                                                {profile?.id === post.user_id ? (
                                                    <button
                                                        onClick={() => handleDeletePost(post.id, post.media_url)}
                                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <HugeiconsIcon icon={Delete02Icon} className="w-4 h-4" strokeWidth={2} />
                                                        Delete Post
                                                    </button>
                                                ) : (
                                                    <button className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-gray-400 cursor-not-allowed">
                                                        Report Post
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Post Text */}
                                {post.content && (
                                    <p className="text-gray-900 text-[16px] leading-[1.4] font-bold break-words pr-2">
                                        {post.content}
                                    </p>
                                )}

                                {post.media_url && (
                                    <div className="w-full rounded-xl overflow-hidden mt-3 cursor-pointer group/img bg-black">
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
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-40 text-center opacity-30 px-6">
                        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm">
                            <HugeiconsIcon icon={Image01Icon} className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-black font-newyork text-gray-900">The hive is quiet</h3>
                        <p className="text-gray-500 font-bold mt-2">Start the conversion by posting what's happening!</p>
                    </div>
                )}

                {/* Loading indicator for infinite scroll */}
                {loadingMore && (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffc107]"></div>
                    </div>
                )}

                {/* Intersection Observer Target */}
                <div ref={observerTarget} className="h-4 w-full" />

                {!hasMore && posts.length > 0 && (
                    <div className="text-center py-6 text-gray-400 font-medium text-sm">
                        You've reached the end of the hive.
                    </div>
                )}
            </div>

        </div >
    );
}
