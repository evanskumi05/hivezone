"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useUI } from "@/components/ui/UIProvider";
import { useFeed } from "@/components/providers/FeedProvider";
import { HugeiconsIcon } from "@hugeicons/react";
import { FeedPostSkeleton } from "@/components/ui/Skeleton";
import Avatar from "@/components/ui/Avatar";
import {
    Image01Icon,
    Attachment01Icon,
    Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { Virtuoso } from "react-virtuoso";
import FeedPostCard from "@/components/FeedPostCard";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { compressForFeed } from "@/utils/compressImage";

const MainFeed = React.forwardRef(({ onPostsReady, pageProfile: bannerProfile }, ref) => {
    const { showToast, confirmAction, openReportModal } = useUI();
    const queryClient = useQueryClient();
    const {
        activeTab, setActiveTab,
        pageProfile: contextProfile,
        setPageProfile
    } = useFeed();

    // Use either bannerProfile (from Dash) or contextProfile (cached)
    const profile = bannerProfile || contextProfile;
    
    const [postContent, setPostContent] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaType, setMediaType] = useState("image");
    const fileInputRef = useRef(null);
    const supabase = useRef(createClient()).current;
    
    // Virtuoso State
    const virtuosoRef = useRef(null);
    const limit = 15;

    /**
     * CORE: THE CACHED DATA ENGINE (React Query)
     */
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch,
    } = useInfiniteQuery({
        queryKey: ['FEED_STREAM', activeTab, profile?.institution],
        queryFn: async ({ pageParam = 0 }) => {
            const currentInstitution = profile?.institution;
            if (!currentInstitution) return [];

            if (activeTab === 'trending') {
                if (pageParam > 0) return []; 
                
                const { data: feedsData, error } = await supabase
                    .from("feeds")
                    .select(`
                        *,
                        author:users!inner (
                            display_name,
                            first_name,
                            username,
                            profile_picture,
                            is_verified,
                            is_admin,
                            institution
                        ),
                        likes:feed_likes(user_id),
                        comments:feed_comments(count)
                    `)
                    .eq('author.institution', currentInstitution)
                    .order('created_at', { ascending: false })
                    .limit(30);

                if (error) throw error;
                const { data: { session } } = await supabase.auth.getSession();
                const processed = (feedsData || []).map(post => ({
                    ...post,
                    likes_count: post.likes?.length || 0,
                    comments_count: post.comments?.[0]?.count || 0,
                    is_liked: post.likes?.some(l => l.user_id === (session?.user?.id))
                })).sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count));
                
                return processed.slice(0, 15);
            }

            const from = pageParam * limit;
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
                        is_admin,
                        institution
                    ),
                    likes:feed_likes(user_id),
                    comments:feed_comments(count)
                `)
                .eq('author.institution', currentInstitution)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            const { data: { session } } = await supabase.auth.getSession();
            return (feedsData || []).map(post => ({
                ...post,
                likes_count: post.likes?.length || 0,
                comments_count: post.comments?.[0]?.count || 0,
                is_liked: post.likes?.some(l => l.user_id === (session?.user?.id))
            }));
        },
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === limit ? allPages.length : undefined;
        },
        staleTime: 1000 * 60 * 5,
        enabled: !!profile?.institution,
    });

    const allPosts = useMemo(() => data?.pages.flat() || [], [data]);

    React.useImperativeHandle(ref, () => ({
        refresh: async () => {
            await refetch();
            virtuosoRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }));

    const handleTabChange = (tab) => {
        if (tab !== activeTab) {
            setActiveTab(tab);
            virtuosoRef.current?.scrollTo({ top: 0, behavior: 'auto' });
        }
    };

    const handleEndReached = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    const handleLike = async (post) => {
        const isLiked = post.is_liked;
        const postId = post.id;
        const currentUserId = (await supabase.auth.getSession()).data.session?.user?.id;

        queryClient.setQueryData(['FEED_STREAM', activeTab, profile?.institution], (oldData) => {
            if (!oldData) return oldData;
            return {
                ...oldData,
                pages: oldData.pages.map(page => 
                    page.map(p => p.id === postId ? {
                        ...p,
                        is_liked: !isLiked,
                        likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1
                    } : p)
                )
            };
        });

        if (isLiked) {
            await supabase.from('feed_likes').delete().eq('feed_id', postId).eq('user_id', currentUserId);
        } else {
            await supabase.from('feed_likes').insert([{ feed_id: postId, user_id: currentUserId }]);
            if (post.user_id !== currentUserId) {
                const { data: existingNotif } = await supabase
                    .from('notifications')
                    .select('id, actor_id')
                    .eq('user_id', post.user_id)
                    .eq('type', 'like')
                    .eq('entity_id', postId)
                    .eq('is_read', false)
                    .single();

                if (existingNotif) {
                    const othersCount = (post.likes_count || 0);
                    const actorName = profile?.display_name || profile?.first_name || 'User';
                    const message = othersCount > 0
                        ? `${actorName} and ${othersCount} others liked your post`
                        : `liked your post`;

                    await supabase
                        .from('notifications')
                        .update({
                            actor_id: currentUserId,
                            message: message,
                            created_at: new Date().toISOString()
                        })
                        .eq('id', existingNotif.id);
                } else {
                    const actorName = profile?.display_name || profile?.first_name || 'User';
                    await supabase.from('notifications').insert({
                        user_id: post.user_id,
                        actor_id: currentUserId,
                        type: 'like',
                        entity_type: 'feed',
                        entity_id: postId,
                        message: `liked your post`
                    });

                    fetch('/api/notifications/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userIds: [post.user_id],
                            title: actorName,
                            message: "liked your post",
                            url: `${window.location.origin}/dashboard`
                        })
                    }).catch(err => console.error("Push notification failed:", err));
                }
            }
        }
    };

    const handlePost = async () => {
        if (!postContent.trim() && !selectedMedia) return;
        setIsPosting(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            let url = null;
            if (selectedMedia) {
                // Compress image before upload (videos pass through unchanged)
                const fileToUpload = await compressForFeed(selectedMedia);
                const fileExt = fileToUpload.name.split('.').pop();
                const fileName = `post-media/${session.user.id}-${Date.now()}.${fileExt}`;

                // 1. Get presigned URL from our API
                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fileName: fileName,
                        fileType: fileToUpload.type,
                    }),
                });

                if (!uploadRes.ok) throw new Error("Failed to get upload URL");
                const { uploadUrl, publicUrl } = await uploadRes.json();

                // 2. Upload directly to Cloudflare R2
                const r2Res = await fetch(uploadUrl, {
                    method: "PUT",
                    headers: { "Content-Type": fileToUpload.type },
                    body: fileToUpload,
                });

                if (!r2Res.ok) throw new Error("Failed to upload media");
                url = publicUrl;
            }

            const { data: newPost, error } = await supabase
                .from('feeds')
                .insert([{ user_id: session.user.id, content: postContent, media_url: url }])
                .select("*, author:users!inner(*)")
                .single();

            if (error) throw error;

            const freshPost = { ...newPost, likes_count: 0, comments_count: 0, is_liked: false };
            queryClient.setQueryData(['FEED_STREAM', 'all', profile?.institution], (oldData) => {
                if (!oldData) return { pages: [[freshPost]], pageParams: [0] };
                return {
                    ...oldData,
                    pages: [[freshPost, ...oldData.pages[0]], ...oldData.pages.slice(1)]
                };
            });

            setPostContent("");
            setSelectedMedia(null);
            setMediaPreview(null);
            showToast("Successfully buzzed!", "success");
        } catch (error) {
            showToast("Failed to create post.", "error");
        } finally {
            setIsPosting(false);
        }
    };

    const handleDeletePost = async (postId) => {
        const confirmed = await confirmAction({
            title: "Delete Post?",
            message: "Permanently remove this buzzing?",
            confirmText: "Delete",
            type: "danger"
        });
        if (!confirmed) return;
        try {
            queryClient.setQueryData(['FEED_STREAM', activeTab, profile?.institution], (oldData) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map(page => page.filter(p => p.id !== postId))
                };
            });
            await supabase.from('feeds').delete().eq('id', postId);
            showToast("Post deleted.");
        } catch (error) {
            showToast("Failed to delete.", "error");
            refetch();
        }
    };

    const handleReportPost = (post) => openReportModal({ item_id: post.id, item_type: 'feed' });

    const handleMediaSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMediaType(file.type.startsWith("video/") ? "video" : "image");
            setSelectedMedia(file);
            setMediaPreview(URL.createObjectURL(file));
        }
    };

    const Header = () => (
        <div className="flex flex-col gap-4 w-full bg-[#fcf6de] pb-4">
            <div className="mb-4">
                <WelcomeBanner firstName={profile?.first_name} email={profile?.email} />
            </div>

            <div className="flex items-center justify-between mt-4 mb-0">
                <h2 className="text-2xl sm:text-3xl font-black tracking-wide font-newyork text-gray-900 leading-none">
                    Campus Feed
                </h2>
            </div>

            <div className="border-b border-gray-200 flex items-center mb-2">
                {['all', 'trending'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={`flex-1 pb-3 px-1 font-black text-[15px] transition-all relative ${
                            activeTab === tab ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {tab === 'all' ? 'All' : 'Trending'}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#ffc107] rounded-full" />}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 flex flex-col mb-2">
                <div className="flex gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 shrink-0 block rounded-full">
                        <Avatar
                            src={profile?.profile_picture}
                            name={profile?.first_name || "User"}
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

                <div className="flex items-center justify-between mt-2 pl-[3.5rem] sm:pl-[4.5rem]">
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
            
            {isLoading && allPosts.length === 0 && (
                <div className="flex flex-col gap-4 mt-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                            <FeedPostSkeleton />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const Footer = () => (
        <div className="flex flex-col gap-3 py-6">
            {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffc107]"></div>
                </div>
            )}

            {!hasNextPage && allPosts.length > 0 && (
                <div className="text-center py-8 text-gray-400 font-bold text-sm">
                    {activeTab === 'all' ? "You've reached the end of the hive." : "That's all the top trending posts right now."}
                </div>
            )}
            
            {allPosts.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 px-6">
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm">
                        <HugeiconsIcon icon={Image01Icon} className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-black font-newyork text-gray-900">The hive is quiet</h3>
                    <p className="text-gray-500 font-bold mt-1 max-w-[200px]">
                        {activeTab === 'all' ? "Start the conversation by posting what's happening!" : "No trending posts yet."}
                    </p>
                </div>
            )}
            <div className="h-20 w-full" />
        </div>
    );

    return (
        <div className="flex flex-col w-full flex-1 min-h-0 h-full">
            <Virtuoso
                ref={virtuosoRef}
                scrollerRef={(el) => { if (el) el.id = 'dashboard-scroll-container'; }}
                data={allPosts}
                computeItemKey={(index, item) => item.id}
                overscan={3000}
                increaseViewportBy={{ top: 1500, bottom: 1500 }}
                atBottomThreshold={600}
                endReached={handleEndReached}
                className="scrollbar-hide overscroll-contain"
                components={{ Header, Footer }}
                itemContent={(idx, post) => (
                    <div className="pb-3 px-0.5">
                        <FeedPostCard 
                            post={post} 
                            profile={profile} 
                            onDelete={handleDeletePost} 
                            onReport={handleReportPost} 
                            onLike={handleLike} 
                        />
                    </div>
                )}
            />
        </div>
    );
});

MainFeed.displayName = "MainFeed";
export default MainFeed;
