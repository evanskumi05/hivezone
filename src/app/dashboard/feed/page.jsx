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
    Delete02Icon,
    Alert01Icon,
    FavouriteIcon,
    Comment01Icon
} from "@hugeicons/core-free-icons";
import AutoPauseVideo from "@/components/ui/AutoPauseVideo";
import FeedPostCard from "@/components/FeedPostCard";

export default function DedicatedFeedPage() {
    const { showToast, confirmAction, showImage, openReportModal } = useUI();
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
    const [activeCommentId, setActiveCommentId] = useState(null);
    const [commentsData, setCommentsData] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [loadingComments, setLoadingComments] = useState({});
    const fileInputRef = useRef(null);
    const supabase = createClient();


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
                    ),
                    likes:feed_likes(user_id),
                    comments:feed_comments(count)
                `)
                .eq('author.institution', targetInstitution)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            if (feedsData) {
                const { data: { session } } = await supabase.auth.getSession();
                const processed = feedsData.map(post => ({
                    ...post,
                    likes_count: post.likes?.length || 0,
                    comments_count: post.comments?.[0]?.count || 0,
                    is_liked: post.likes?.some(l => l.user_id === (profile?.id || session?.user?.id))
                }));

                if (isInitial) {
                    setPosts(processed);
                } else {
                    setPosts(prev => [...prev, ...processed]);
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

    const handleReportPost = async (post) => {
        openReportModal({
            item_id: post.id,
            item_type: 'feed',
            onSuccess: () => setOpenMenuId(null)
        });
    };

    const handleLike = async (post) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const isLiked = post.is_liked;
            const postId = post.id;

            // Optimistic update
            setPosts(prev => prev.map(p =>
                p.id === postId
                    ? { ...p, is_liked: !isLiked, likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1 }
                    : p
            ));

            if (isLiked) {
                await supabase.from('feed_likes').delete().eq('feed_id', postId).eq('user_id', session.user.id);
            } else {
                await supabase.from('feed_likes').insert([{ feed_id: postId, user_id: session.user.id }]);

                // Grouped Notification Logic for Likes
                if (post.user_id !== session.user.id) {
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
                                actor_id: session.user.id,
                                message: message,
                                created_at: new Date().toISOString()
                            })
                            .eq('id', existingNotif.id);
                    } else {
                        const actorName = profile?.display_name || profile?.first_name || 'User';
                        await supabase.from('notifications').insert({
                            user_id: post.user_id,
                            actor_id: session.user.id,
                            type: 'like',
                            entity_type: 'feed',
                            entity_id: postId,
                            message: `liked your post`
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            // Revert on error
            setPosts(prev => prev.map(p =>
                p.id === post.id
                    ? { ...p, is_liked: post.is_liked, likes_count: post.likes_count }
                    : p
            ));
        }
    };

    const fetchComments = async (postId) => {
        if (commentsData[postId]) return;
        setLoadingComments(prev => ({ ...prev, [postId]: true }));
        try {
            const { data, error } = await supabase
                .from('feed_comments')
                .select(`
                    *,
                    author:users (
                        display_name,
                        username,
                        profile_picture
                    )
                `)
                .eq('feed_id', postId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setCommentsData(prev => ({ ...prev, [postId]: data }));
        } catch (error) {
            console.error("Error fetching comments:", error);
            showToast("Failed to load comments.", "error");
        } finally {
            setLoadingComments(prev => ({ ...prev, [postId]: false }));
        }
    };

    const handleCommentSubmit = async (postId) => {
        const content = commentInputs[postId];
        if (!content?.trim()) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: newComment, error } = await supabase
                .from('feed_comments')
                .insert([{
                    feed_id: postId,
                    user_id: session.user.id,
                    content: content.trim()
                }])
                .select(`
                    *,
                    author:users (
                        display_name,
                        username,
                        profile_picture
                    )
                `)
                .single();

            if (error) throw error;

            setCommentsData(prev => ({
                ...prev,
                [postId]: [...(prev[postId] || []), newComment]
            }));
            setCommentInputs(prev => ({ ...prev, [postId]: "" }));

            // Update counts in posts
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
            ));

            // Grouped Notification Logic for Comments
            const post = posts.find(p => p.id === postId);
            if (post && post.user_id !== session.user.id) {
                const { data: existingNotif } = await supabase
                    .from('notifications')
                    .select('id, actor_id')
                    .eq('user_id', post.user_id)
                    .eq('type', 'comment')
                    .eq('entity_id', postId)
                    .eq('is_read', false)
                    .single();

                if (existingNotif) {
                    const othersCount = (post.comments_count || 0);
                    const actorName = profile?.display_name || profile?.first_name || 'User';
                    const message = othersCount > 0
                        ? `${actorName} and ${othersCount} others commented on your post`
                        : `commented on your post`;

                    await supabase
                        .from('notifications')
                        .update({
                            actor_id: session.user.id,
                            message: message,
                            created_at: new Date().toISOString()
                        })
                        .eq('id', existingNotif.id);
                } else {
                    const actorName = profile?.display_name || profile?.first_name || 'User';
                    await supabase.from('notifications').insert({
                        user_id: post.user_id,
                        actor_id: session.user.id,
                        type: 'comment',
                        entity_type: 'feed',
                        entity_id: postId,
                        message: `commented on your post`
                    });
                }
            }

        } catch (error) {
            console.error("Error posting comment:", error);
            showToast("Failed to post comment.", "error");
        }
    };

    const handleDeleteComment = async (commentId, postId) => {
        confirmAction({
            title: "Delete Comment",
            message: "Are you sure you want to delete this comment?",
            confirmText: "Delete",
            type: "danger",
            onConfirm: async () => {
                try {
                    const { error } = await supabase
                        .from('feed_comments')
                        .delete()
                        .eq('id', commentId);

                    if (error) throw error;

                    // Update UI state
                    setCommentsData(prev => ({
                        ...prev,
                        [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
                    }));

                    // Update count in posts
                    setPosts(prev => prev.map(p =>
                        p.id === postId ? { ...p, comments_count: Math.max(0, (p.comments_count || 1) - 1) } : p
                    ));

                    showToast("Comment deleted successfully.", "success");
                } catch (error) {
                    console.error("Error deleting comment:", error);
                    showToast("Failed to delete comment.", "error");
                }
            }
        });
    };

    const toggleComments = (postId) => {
        if (activeCommentId === postId) {
            setActiveCommentId(null);
        } else {
            setActiveCommentId(postId);
            fetchComments(postId);
        }
    };


    return (
        <div className="flex flex-col h-full bg-[#fcf6de] p-2 sm:p-8 pt-0 gap-4 max-w-[800px] mx-auto w-full min-h-screen overflow-x-hidden">

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
            <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 flex flex-col mb-4">
                <div className="flex gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 shrink-0 block rounded-full">
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
                        <FeedPostCard
                            key={post.id}
                            post={post}
                            profile={profile}
                            supabase={supabase}
                            onDelete={handleDeletePost}
                            onReport={handleReportPost}
                            onLike={handleLike}
                            activeCommentId={activeCommentId}
                            toggleComments={toggleComments}
                            commentsData={commentsData}
                            commentInputs={commentInputs}
                            setCommentInputs={setCommentInputs}
                            handleCommentSubmit={handleCommentSubmit}
                            handleDeleteComment={handleDeleteComment}
                            loadingComments={loadingComments}
                        />
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
