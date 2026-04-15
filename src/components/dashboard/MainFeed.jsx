"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useUI } from "@/components/ui/UIProvider";
import { useFeed } from "@/components/providers/FeedProvider";
import { HugeiconsIcon } from "@hugeicons/react";
import { FeedPostSkeleton } from "@/components/ui/Skeleton";
import Avatar from "@/components/ui/Avatar";
import { Image01Icon, Attachment01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Virtuoso } from "react-virtuoso";
import FeedPostCard from "@/components/FeedPostCard";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { compressForFeed } from "@/utils/compressImage";

// Uncontrolled composer — typing never triggers a re-render anywhere
const PostComposer = React.memo(({ profile, onPost, isPosting }) => {
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const selectedMediaRef = useRef(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaType, setMediaType] = useState("image");

    const selectedThumbnailRef = useRef(null);

    const handlePost = useCallback(() => {
        const content = textareaRef.current?.value || "";
        onPost(content, selectedMediaRef.current, selectedThumbnailRef.current, () => {
            if (textareaRef.current) textareaRef.current.value = "";
            selectedMediaRef.current = null;
            selectedThumbnailRef.current = null;
            setMediaPreview(null);
        });
    }, [onPost]);

    return (
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 flex flex-col mb-2">
            <div className="flex gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 shrink-0 rounded-full">
                    <Avatar src={profile?.profile_picture} name={profile?.first_name || "User"} className="w-full h-full rounded-full" />
                </div>
                <div className="flex-1">
                    <textarea
                        ref={textareaRef}
                        id="buzz-input"
                        aria-label="What's happening?"
                        placeholder="What's happening on campus?"
                        defaultValue=""
                        className="w-full bg-transparent border-none outline-none resize-none text-gray-800 placeholder:text-gray-400 font-bold text-[18px] pt-3 min-h-[60px]"
                    />
                    {mediaPreview && (
                        <div className="relative mt-2 mb-2 inline-block">
                            {mediaType === "video"
                                ? <video src={mediaPreview} controls className="max-h-60 rounded-xl" />
                                : <img src={mediaPreview} alt="Preview" className="max-h-60 rounded-xl" />
                            }
                            <button onClick={() => { selectedMediaRef.current = null; setMediaPreview(null); }}
                                className="absolute -top-3 -right-3 bg-black text-white rounded-full p-1.5 shadow-md hover:scale-110 transition-transform">
                                <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center justify-between mt-2 pl-[3.5rem] sm:pl-[4.5rem]">
                <div className="flex items-center gap-3">
                    <input type="file" ref={fileInputRef} accept="image/*,video/*" className="hidden"
                        onChange={(e) => {
                            const f = e.target.files[0];
                            if (f) {
                                const isVideo = f.type.startsWith("video/");
                                setMediaType(isVideo ? "video" : "image");
                                selectedMediaRef.current = f;
                                setMediaPreview(URL.createObjectURL(f));

                                if (isVideo) {
                                    // Extract high-quality thumbnail frame instantly
                                    const video = document.createElement('video');
                                    video.preload = 'metadata';
                                    video.muted = true;
                                    video.src = URL.createObjectURL(f);
                                    video.onloadedmetadata = () => {
                                        video.currentTime = 0.5;
                                        video.onseeked = () => {
                                            const canvas = document.createElement('canvas');
                                            canvas.width = video.videoWidth;
                                            canvas.height = video.videoHeight;
                                            canvas.getContext('2d').drawImage(video, 0, 0);
                                            canvas.toBlob((blob) => {
                                                selectedThumbnailRef.current = blob;
                                            }, 'image/jpeg', 0.8);
                                            URL.revokeObjectURL(video.src);
                                        };
                                    };
                                }
                            }
                        }}
                    />
                    <button onClick={() => fileInputRef.current.click()}
                        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-black transition-colors border border-gray-100">
                        <HugeiconsIcon icon={Attachment01Icon} className="w-5 h-5" strokeWidth={2} />
                    </button>
                </div>
                <button onClick={handlePost} disabled={isPosting}
                    className={`bg-[#ffc107] hover:bg-[#ffca2c] text-black font-bold text-[15px] px-6 py-1.5 rounded-full transition-all active:scale-95 shadow-sm ${isPosting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                    {isPosting ? 'Posting...' : 'Post'}
                </button>
            </div>
        </div>
    );
});
PostComposer.displayName = "PostComposer";

const FeedListHeader = React.memo(({ profile, activeTab, onTabChange, isLoading, hasNoPosts, onPost, isPosting }) => (
    <div className="flex flex-col gap-4 w-full bg-[#fcf6de] pb-2 px-4 sm:px-0">
        <div className="mb-4">
            <WelcomeBanner firstName={profile?.first_name} />
        </div>
        <div className="flex items-center justify-between mt-4 mb-0">
            <h2 className="text-2xl sm:text-3xl font-black tracking-wide font-newyork text-gray-900 leading-none">Campus Feed</h2>
        </div>
        <div className="border-b border-gray-200 flex items-center mb-2">
            {['all', 'trending'].map((tab) => (
                <button key={tab} onClick={() => onTabChange(tab)}
                    className={`flex-1 pb-3 px-1 font-black text-[15px] transition-all relative ${activeTab === tab ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
                    {tab === 'all' ? 'All' : 'Trending'}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#ffc107] rounded-full" />}
                </button>
            ))}
        </div>
        <PostComposer profile={profile} onPost={onPost} isPosting={isPosting} />
        {isLoading && hasNoPosts && (
            <div className="flex flex-col gap-4 mt-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                        <FeedPostSkeleton />
                    </div>
                ))}
            </div>
        )}
    </div>
));
FeedListHeader.displayName = "FeedListHeader";

const FeedListFooter = React.memo(({ isFetchingNextPage, hasNextPage, isEmpty, isLoading, activeTab }) => (
    <div className="flex flex-col gap-3 py-6">
        {isFetchingNextPage && <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffc107]"></div></div>}
        {!hasNextPage && !isEmpty && <div className="text-center py-8 text-gray-400 font-bold text-sm">{activeTab === 'all' ? "You've reached the end of the hive." : "That's all the top trending posts right now."}</div>}
        {isEmpty && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 px-6">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm">
                    <HugeiconsIcon icon={Image01Icon} className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-black font-newyork text-gray-900">The hive is quiet</h3>
                <p className="text-gray-500 font-bold mt-1 max-w-[200px]">{activeTab === 'all' ? "Start the conversation by posting what's happening!" : "No trending posts yet."}</p>
            </div>
        )}
        <div className="h-20 w-full" />
    </div>
));
FeedListFooter.displayName = "FeedListFooter";

const VirtuosoHeader = React.forwardRef(({ context }, ref) => (
    <div ref={ref}>
        <FeedListHeader {...context} />
    </div>
));
VirtuosoHeader.displayName = "VirtuosoHeader";

const VirtuosoFooter = React.forwardRef(({ context }, ref) => (
    <div ref={ref}>
        <FeedListFooter {...context} />
    </div>
));
VirtuosoFooter.displayName = "VirtuosoFooter";

const MainFeed = React.forwardRef(({ pageProfile: bannerProfile }, ref) => {
    const { showToast, confirmAction, openReportModal } = useUI();
    const queryClient = useQueryClient();
    const { activeTab, setActiveTab, pageProfile: contextProfile } = useFeed();
    const profile = bannerProfile || contextProfile;
    const [isPosting, setIsPosting] = useState(false);
    const supabase = useRef(createClient()).current;
    const virtuosoRef = useRef(null);
    const limit = 15;

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } = useInfiniteQuery({
        queryKey: ['FEED_STREAM', activeTab, profile?.school_id],
        queryFn: async ({ pageParam = 0 }) => {
            const sid = profile?.school_id;
            const uid = profile?.id;
            if (!sid) return [];
            
            if (activeTab === 'trending') {
                if (pageParam > 0) return [];
                const { data: fd, error } = await supabase.from("feeds")
                    .select(`*, author:users!inner(display_name,first_name,username,profile_picture,is_verified,is_admin,school_id)`)
                    .eq('school_id', sid).order('likes_count', { ascending: false }).limit(30);
                if (error) throw error;
                
                const postIds = (fd || []).map(p => p.id);
                let likedSet = new Set();
                if (postIds.length > 0 && uid) {
                    const { data: userLikes } = await supabase.from('feed_likes').select('feed_id').eq('user_id', uid).in('feed_id', postIds);
                    if (userLikes) likedSet = new Set(userLikes.map(l => l.feed_id));
                }
                
                return (fd || []).map(p => ({ ...p, is_liked: likedSet.has(p.id) }));
            }

            const { data: fd, error } = await supabase.from("feeds")
                .select(`*, author:users!inner(display_name,username,profile_picture,is_verified,is_admin,school_id)`)
                .eq('school_id', sid).order('created_at', { ascending: false }).range(pageParam * limit, pageParam * limit + limit - 1);
            if (error) throw error;
            
            const postIds = (fd || []).map(p => p.id);
            let likedSet = new Set();
            if (postIds.length > 0 && uid) {
                const { data: userLikes } = await supabase.from('feed_likes').select('feed_id').eq('user_id', uid).in('feed_id', postIds);
                if (userLikes) likedSet = new Set(userLikes.map(l => l.feed_id));
            }

            return (fd || []).map(p => ({ ...p, is_liked: likedSet.has(p.id) }));
        },
        getNextPageParam: (lastPage, allPages) => lastPage.length === limit ? allPages.length : undefined,
        staleTime: 1000 * 60 * 5,
        enabled: !!profile?.school_id,
    });

    const allPosts = useMemo(() => data?.pages.flat() || [], [data]);

    React.useImperativeHandle(ref, () => ({
        refresh: async () => { await refetch(); virtuosoRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }
    }));

    const handleTabChange = useCallback((tab) => {
        if (tab !== activeTab) { setActiveTab(tab); virtuosoRef.current?.scrollTo({ top: 0, behavior: 'auto' }); }
    }, [activeTab, setActiveTab]);

    // Receives content + media from PostComposer refs, plus a reset callback
    const handlePost = useCallback(async (content, mediaFile, thumbnailBlob, resetComposer) => {
        if (!content.trim() && !mediaFile) return;
        setIsPosting(true);

        const tempId = `temp-${Date.now()}`;
        const localMediaUrl = mediaFile ? URL.createObjectURL(mediaFile) : null;
        const localThumbnailUrl = thumbnailBlob ? URL.createObjectURL(thumbnailBlob) : null;
        
        // 1. OPTIMISTIC UPDATE: Insert "Ghost Post" immediately
        const ghostPost = {
            id: tempId,
            user_id: profile?.id,
            content,
            media_url: localMediaUrl,
            thumbnail_url: localThumbnailUrl, // Use the extracted local frame immediately
            school_id: profile?.school_id,
            created_at: new Date().toISOString(),
            likes_count: 0,
            comments_count: 0,
            is_liked: false,
            is_ghost: true,
            author: profile
        };

        queryClient.setQueryData(['FEED_STREAM', 'all', profile?.school_id], (old) => {
            if (!old) return { pages: [[ghostPost]], pageParams: [0] };
            return { ...old, pages: [[ghostPost, ...old.pages[0]], ...old.pages.slice(1)] };
        });

        resetComposer();

        try {
            const { data: { session } } = await supabase.auth.getSession();
            let finalMediaUrl = null;
            let finalThumbnailUrl = null;

            // Upload Thumbnail if it exists
            if (thumbnailBlob) {
                const thumbName = `post-media/thumb-${session.user.id}-${Date.now()}.jpg`;
                const uploadRes = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: thumbName, fileType: 'image/jpeg' }) });
                if (uploadRes.ok) {
                    const { uploadUrl, publicUrl } = await uploadRes.json();
                    await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": 'image/jpeg' }, body: thumbnailBlob });
                    finalThumbnailUrl = publicUrl;
                }
            }

            if (mediaFile) {
                const fileToUpload = await compressForFeed(mediaFile);
                const fileExt = fileToUpload.name.split('.').pop();
                const fileName = `post-media/${session.user.id}-${Date.now()}.${fileExt}`;
                const uploadRes = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName, fileType: fileToUpload.type }) });
                if (!uploadRes.ok) throw new Error("Failed to get upload URL");
                const { uploadUrl, publicUrl } = await uploadRes.json();
                const r2Res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": fileToUpload.type }, body: fileToUpload });
                if (!r2Res.ok) throw new Error("Failed to upload");
                finalMediaUrl = publicUrl;
            }

            const { data: realPost, error } = await supabase.from('feeds')
                .insert([{ user_id: session.user.id, content, media_url: finalMediaUrl, thumbnail_url: finalThumbnailUrl, school_id: profile?.school_id }])
                .select("*, author:users!inner(*)").single();

            if (error) throw error;

            queryClient.setQueryData(['FEED_STREAM', 'all', profile?.school_id], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page, i) => i === 0 ? [realPost, ...page.filter(p => p.id !== tempId)] : page)
                };
            });
            
            showToast("Successfully buzzed!", "success");
        } catch (err) {
            console.error("Failed to post:", err);
            showToast("Failed to create post.", "error");
            queryClient.setQueryData(['FEED_STREAM', 'all', profile?.school_id], (old) => {
                if (!old) return old;
                return { ...old, pages: old.pages.map(page => page.filter(p => p.id !== tempId)) };
            });
        } finally {
            setIsPosting(false);
            if (localMediaUrl) URL.revokeObjectURL(localMediaUrl);
            if (localThumbnailUrl) URL.revokeObjectURL(localThumbnailUrl);
        }
    }, [profile, supabase, queryClient, showToast]);

    const handleLike = useCallback(async (post) => {
        const isLiked = post.is_liked; const postId = post.id;
        const actorName = profile?.display_name || profile?.first_name || 'User';
        
        // Optimistic Update
        ["all", "trending"].forEach((tab) => {
            queryClient.setQueryData(['FEED_STREAM', tab, profile?.school_id], (old) => {
                if (!old) return old;
                return { ...old, pages: old.pages.map(page => page.map(p => p.id === postId ? { ...p, is_liked: !isLiked, likes_count: isLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1 } : p)) };
            });
        });

        // Background Processing via Edge Function
        try {
            const { error } = await supabase.functions.invoke('process-post-action', {
                body: { 
                    postId, 
                    action: isLiked ? 'unlike' : 'like',
                    actorName
                }
            });
            if (error) throw error;
        } catch (err) {
            console.error("Failed to process like:", err);
            // Revert optimistic update on failure
            queryClient.invalidateQueries(['FEED_STREAM', activeTab, profile?.school_id]);
        }
    }, [activeTab, profile, supabase, queryClient]);

    const handleDeletePost = useCallback(async (postId) => {
        const confirmed = await confirmAction({ title: "Delete Post?", message: "Permanently remove this buzzing?", confirmText: "Delete", type: "danger" });
        if (!confirmed) return;
        try {
            queryClient.setQueryData(['FEED_STREAM', activeTab, profile?.school_id], (old) => {
                if (!old) return old;
                return { ...old, pages: old.pages.map(page => page.filter(p => p.id !== postId)) };
            });
            await supabase.from('feeds').delete().eq('id', postId);
            showToast("Post deleted.");
        } catch { showToast("Failed to delete.", "error"); refetch(); }
    }, [activeTab, profile, supabase, queryClient, confirmAction, showToast, refetch]);

    const handleReportPost = useCallback((post) => openReportModal({ item_id: post.id, item_type: 'feed' }), [openReportModal]);

    const handlePrefetchPost = useCallback((postId) => {
        queryClient.prefetchQuery({
            queryKey: ['FEED_POST', postId],
            queryFn: async () => {
                const { data, error } = await supabase.from("feeds")
                    .select(`*, author:users(*)`)
                    .eq('id', postId)
                    .single();
                if (error) throw error;
                return data;
            },
            staleTime: 1000 * 60 * 5
        });
    }, [queryClient, supabase]);

    const virtuosoContext = useMemo(() => ({
        profile,
        activeTab,
        onTabChange: handleTabChange,
        isLoading,
        hasNoPosts: allPosts.length === 0,
        onPost: handlePost,
        isPosting,
        isFetchingNextPage,
        hasNextPage,
        isEmpty: allPosts.length === 0
    }), [profile, activeTab, handleTabChange, isLoading, allPosts.length, handlePost, isPosting, isFetchingNextPage, hasNextPage]);

    return (
        <div className="flex flex-col w-full flex-1 min-h-0 h-full">
            <Virtuoso
                ref={virtuosoRef}
                scrollerRef={(el) => { if (el) el.id = 'dashboard-scroll-container'; }}
                data={allPosts}
                computeItemKey={(index, item) => item.id}
                overscan={600} // Optimized for mobile
                increaseViewportBy={{ top: 600, bottom: 600 }} 
                atBottomThreshold={600} 
                endReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
                className="scrollbar-hide overscroll-contain"
                context={virtuosoContext}
                components={{ Header: VirtuosoHeader, Footer: VirtuosoFooter }}
                itemContent={(idx, post) => (
                    <div 
                        className="pb-0 px-0"
                        onMouseEnter={() => handlePrefetchPost(post.id)}
                        onTouchStart={() => handlePrefetchPost(post.id)}
                    >
                        <FeedPostCard post={post} profile={profile} onDelete={handleDeletePost} onReport={handleReportPost} onLike={handleLike} />
                    </div>
                )}
            />
        </div>
    );
});

MainFeed.displayName = "MainFeed";
export default MainFeed;
