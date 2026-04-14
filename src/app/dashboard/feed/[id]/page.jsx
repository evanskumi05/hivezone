"use client";
// Force refresh to clear stale build cache: 2026-03-13

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useUI } from "@/components/ui/UIProvider";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ArrowLeft01Icon,
    FavouriteIcon,
    Comment01Icon,
    Image01Icon,
    MoreHorizontalCircle01Icon,
    Delete02Icon,
    Alert01Icon,
    CheckmarkBadge01Icon,
    Message01Icon,
    SentIcon
} from "@hugeicons/core-free-icons";
import Avatar from "@/components/ui/Avatar";
import AutoPauseVideo from "@/components/ui/AutoPauseVideo";
import Linkify from "@/components/ui/Linkify";
import { FeedPostSkeleton } from "@/components/ui/Skeleton";
import UserBadge from "@/components/ui/UserBadge";
import { feedImageUrl, fullImageUrl } from "@/utils/optimizeImage";

const Comment = ({ comment, allComments, depth = 0, setReplyingTo, setReplyContext, replyInputRef, formatDate, profile, handleDeleteComment }) => {
    const childComments = allComments.filter(c => c.parent_id === comment.id);
    // Only show 2 replies to root comments initially. Hide nested sub-replies (depth > 0) until requested.
    const [visibleRepliesCount, setVisibleRepliesCount] = useState(depth === 0 ? 2 : 0);

    const handleReplyClick = (e) => {
        e.stopPropagation();
        setReplyingTo(comment.id);
        setReplyContext({
            display_name: comment.author?.display_name,
            username: comment.author?.username
        });
        // Focus fixed input
        setTimeout(() => {
            if (replyInputRef.current) {
                replyInputRef.current.focus();
            }
        }, 100);
    };

    const hasMoreReplies = childComments.length > visibleRepliesCount;
    const currentReplies = childComments.slice(0, visibleRepliesCount);

    return (
        <div className="flex flex-col relative group/comment">
            {/* Main Comment Row */}
            <div className={`flex gap-3 ${depth > 0 ? "mt-4" : "mt-6"}`}>
                {/* Avatar Column */}
                <div className="flex flex-col items-center shrink-0 relative">
                    {/* Horizontal Connector Line (for all replies) */}
                    {depth > 0 && (
                        <div className="absolute top-[18px] left-[-24px] sm:left-[-32px] w-[18px] sm:w-[26px] h-[2px] bg-gray-200/80 rounded-full" />
                    )}

                    <Link href={`/dashboard/profile/${comment.author?.username}`} className="z-10">
                        <Avatar
                            src={comment.author?.profile_picture}
                            name={comment.author?.display_name}
                            className={`${depth > 0 ? "w-8 h-8" : "w-10 h-10"} rounded-full shadow-sm border-2 border-white`}
                        />
                    </Link>
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="font-bold text-gray-900 text-[15px] truncate">{comment.author?.display_name}</span>
                        <UserBadge
                            isAdmin={comment.author?.is_admin}
                            isVerified={comment.author?.is_verified}
                            size="sm"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                            <span className="text-gray-500 text-[14px]">@{comment.author?.username}</span>
                            <span className="text-gray-300">·</span>
                            <span className="text-gray-500 text-[13px] font-medium">{formatDate(comment.created_at)}</span>
                        </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 border border-gray-100 shadow-sm transition-all hover:bg-white hover:shadow-md group">
                        {/* Context Tag for deep sub-replies */}
                        {depth > 1 && (
                            <div className="flex items-center gap-1 mb-1.5 text-[10px] font-black text-[#ffc107] uppercase tracking-wider bg-amber-50 w-fit px-2 py-0.5 rounded-full">
                                <span>Replying to</span>
                                <span className="text-amber-700">@{allComments.find(c => c.id === comment.parent_id)?.author?.username}</span>
                            </div>
                        )}
                        <Linkify text={comment.content} className="text-gray-800 text-[15px] leading-[1.5] break-words" />
                    </div>

                    <div className="flex items-center gap-6 mt-1 ml-1 opacity-80 group-hover/comment:opacity-100 transition-opacity">
                        <button
                            onClick={handleReplyClick}
                            className="text-gray-500 text-[11px] font-black uppercase tracking-[0.05em] hover:text-[#ffc107] transition-colors"
                        >
                            Reply
                        </button>
                        {profile?.id === comment.user_id && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteComment(comment.id);
                                }}
                                className="text-gray-400 text-[11px] font-black uppercase tracking-[0.05em] hover:text-red-500 transition-colors"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Recursively Render Children with NON-cumulative indentation */}
            {childComments.length > 0 && (
                <div className={`${depth === 0 ? "ml-[19px] sm:ml-[23px] border-l-2 border-gray-200/60 pl-4 sm:pl-6" : "ml-0"} flex flex-col`}>
                    {currentReplies.map(child => (
                        <Comment
                            key={child.id}
                            comment={child}
                            allComments={allComments}
                            depth={depth + 1}
                            setReplyingTo={setReplyingTo}
                            setReplyContext={setReplyContext}
                            replyInputRef={replyInputRef}
                            formatDate={formatDate}
                            profile={profile}
                            handleDeleteComment={handleDeleteComment}
                        />
                    ))}

                    {/* Local pagination button for replies */}
                    {hasMoreReplies && (
                        <div className="mt-4 mb-2">
                            <button
                                onClick={() => setVisibleRepliesCount(prev => prev === 0 ? 2 : prev + 2)}
                                className="flex items-center gap-2 group/more"
                            >
                                <div className="w-6 sm:w-8 h-[2px] bg-gray-100 group-hover/more:bg-[#ffc107]/30 transition-colors" />
                                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest group-hover/more:text-[#ffc107] transition-colors">
                                    {visibleRepliesCount === 0
                                        ? `Show ${childComments.length} ${childComments.length === 1 ? 'reply' : 'replies'}`
                                        : `Show ${childComments.length - visibleRepliesCount} more ${childComments.length - visibleRepliesCount === 1 ? 'reply' : 'replies'}`
                                    }
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};



// Premium Animations
const heartPop = `
@keyframes heartPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.4); }
  100% { transform: scale(1); }
}
.animate-heart-pop { animation: heartPop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
`;

export default function FeedDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { showToast, confirmAction, showImage, openReportModal } = useUI();
    const supabase = createClient();

    const [post, setPost] = useState(null);
    const [profile, setProfile] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null); // id of comment being replied to
    const [replyContext, setReplyContext] = useState(null); // { display_name, username }
    const [replyContent, setReplyContent] = useState("");
    const [submittingReply, setSubmittingReply] = useState(false);
    const [mediaLoaded, setMediaLoaded] = useState(false);

    const menuRef = useRef(null);
    const replyInputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: profileData } = await supabase
                    .from("users")
                    .select("id, display_name, first_name, profile_picture")
                    .eq("id", session.user.id)
                    .single();
                setProfile(profileData);
            }

            // Fetch post with author
            const { data: postData, error: postError } = await supabase
                .from("feeds")
                .select(`
                    *,
                    author:users (
                        display_name,
                        username,
                        profile_picture,
                        is_verified,
                        is_admin
                    ),
                    likes:feed_likes(user_id),
                    comments:feed_comments(count)
                `)
                .eq("id", id)
                .single();

            if (postError) throw postError;

            const processedPost = {
                ...postData,
                likes_count: postData.likes?.length || 0,
                comments_count: postData.comments?.[0]?.count || 0,
                is_liked: postData.likes?.some(l => l.user_id === session?.user?.id)
            };
            setPost(processedPost);

            // Fetch all comments for this post
            const { data: commentsData, error: commentsError } = await supabase
                .from("feed_comments")
                .select(`
                    *,
                    author:users (
                        display_name,
                        username,
                        profile_picture,
                        is_verified,
                        is_admin
                    )
                `)
                .eq("feed_id", id)
                .order("created_at", { ascending: true });

            if (commentsError) throw commentsError;
            setComments(commentsData || []);

        } catch (error) {
            console.error("Error fetching detail:", error);
            showToast("Failed to load post.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!post || !profile) return;
        try {
            const isLiked = post.is_liked;
            const newIsLiked = !isLiked;
            const newCount = isLiked ? post.likes_count - 1 : post.likes_count + 1;

            setPost({ ...post, is_liked: newIsLiked, likes_count: newCount });

            if (isLiked) {
                await supabase.from("feed_likes").delete().eq("feed_id", post.id).eq("user_id", profile.id);
            } else {
                await supabase.from("feed_likes").insert([{ feed_id: post.id, user_id: profile.id }]);

                // --- Notification Logic ---
                if (post.user_id !== profile.id) {
                    const { data: existingNotif } = await supabase
                        .from('notifications')
                        .select('id, actor_id')
                        .eq('user_id', post.user_id)
                        .eq('type', 'like')
                        .eq('entity_id', post.id)
                        .eq('is_read', false)
                        .single();

                    const actorName = profile.display_name || profile.first_name || 'User';

                    if (existingNotif) {
                        const othersCount = post.likes_count;
                        const message = othersCount > 0
                            ? `${actorName} and ${othersCount} others liked your post`
                            : `liked your post`;

                        await supabase
                            .from('notifications')
                            .update({
                                actor_id: profile.id,
                                message: message,
                                created_at: new Date().toISOString()
                            })
                            .eq('id', existingNotif.id);
                    } else {
                        await supabase.from('notifications').insert({
                            user_id: post.user_id,
                            actor_id: profile.id,
                            type: 'like',
                            entity_type: 'feed',
                            entity_id: post.id,
                            message: `liked your post`
                        });

                        fetch('/api/notifications/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userIds: [post.user_id],
                                title: actorName,
                                message: "liked your post",
                                url: `${window.location.origin}/dashboard/feed/${post.id}`
                            })
                        }).catch(err => console.error("Push notification failed:", err));
                    }
                }
            }
        } catch (error) {
            console.error("Like error:", error);
        }
    };

    const handleCommentSubmit = async (parentId = null) => {
        const content = replyContent.trim();
        if (!content || submittingReply) return;

        // Normalize parentId
        const normalizedParentId = parentId === 'root' ? null : parentId;

        setSubmittingReply(true);
        try {
            const { data: newComment, error } = await supabase
                .from("feed_comments")
                .insert([{
                    feed_id: id,
                    user_id: profile.id,
                    content: content,
                    parent_id: normalizedParentId
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

            setComments([newComment, ...comments]);
            setPost({ ...post, comments_count: post.comments_count + 1 });
            setReplyContent("");
            setReplyingTo(null);
            setReplyContext(null);
            showToast("Reply posted!");

            // --- Notification Logic ---
            const actorName = profile.display_name || profile.first_name || 'User';

            // 1. Notify Post Owner
            if (post.user_id !== profile.id) {
                const { data: existingNotif } = await supabase
                    .from('notifications')
                    .select('id, actor_id')
                    .eq('user_id', post.user_id)
                    .eq('type', 'comment')
                    .eq('entity_id', post.id)
                    .eq('is_read', false)
                    .single();

                if (existingNotif) {
                    const othersCount = post.comments_count;
                    const message = othersCount > 0
                        ? `${actorName} and ${othersCount} others commented on your post`
                        : `commented on your post`;

                    await supabase
                        .from('notifications')
                        .update({
                            actor_id: profile.id,
                            message: message,
                            created_at: new Date().toISOString()
                        })
                        .eq('id', existingNotif.id);
                } else {
                    await supabase.from('notifications').insert({
                        user_id: post.user_id,
                        actor_id: profile.id,
                        type: 'comment',
                        entity_type: 'feed',
                        entity_id: post.id,
                        message: `commented on your post`
                    });

                    fetch('/api/notifications/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userIds: [post.user_id],
                            title: actorName,
                            message: `commented on your post: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
                            url: `${window.location.origin}/dashboard/feed/${post.id}`
                        })
                    }).catch(err => console.error("Push notification failed:", err));
                }
            }

            // 2. Notify Parent Comment Owner (if this is a direct reply to a comment)
            if (normalizedParentId) {
                const parentComment = comments.find(c => c.id === normalizedParentId);
                if (parentComment && parentComment.user_id !== profile.id && parentComment.user_id !== post.user_id) {
                    await supabase.from('notifications').insert({
                        user_id: parentComment.user_id,
                        actor_id: profile.id,
                        type: 'comment',
                        entity_type: 'feed',
                        entity_id: post.id,
                        message: `replied to your comment`
                    });

                    fetch('/api/notifications/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userIds: [parentComment.user_id],
                            title: actorName,
                            message: `replied to your comment: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
                            url: `${window.location.origin}/dashboard/feed/${post.id}`
                        })
                    }).catch(err => console.error("Push notification failed:", err));
                }
            }

        } catch (error) {
            console.error("Comment error:", error);
            showToast("Failed to post reply.", "error");
        } finally {
            setSubmittingReply(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        const confirmed = await confirmAction({
            title: "Delete Comment?",
            message: "This comment will be permanently removed.",
            confirmText: "Delete",
            type: "danger"
        });

        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from("feed_comments")
                .delete()
                .eq("id", commentId);

            if (error) throw error;

            setComments(comments.filter(c => c.id !== commentId));
            setPost(prev => prev ? { ...prev, comments_count: Math.max(0, prev.comments_count - 1) } : prev);
            showToast("Comment deleted.");
        } catch (error) {
            console.error("Delete comment error:", error);
            showToast("Failed to delete comment.", "error");
        }
    };

    const handleDeletePost = async () => {
        const confirmed = await confirmAction({
            title: "Delete Post?",
            message: "This post will be permanently removed.",
            confirmText: "Delete",
            type: "danger"
        });

        if (!confirmed) return;

        try {
            const { error } = await supabase.from("feeds").delete().eq("id", id);
            if (error) throw error;
            router.push("/dashboard/feed");
            showToast("Post deleted.");
        } catch (error) {
            showToast("Delete failed.");
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    // Recursive Comment Component



    if (loading) return (
        <div className="max-w-[800px] mx-auto w-full p-3 sm:p-8 pt-0 min-h-screen bg-[#fcf6de]">
            <div className="flex items-center gap-4 mt-4 sm:mt-8 mb-4 sm:mb-6">
                <button onClick={() => router.back()} className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center">
                    <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5 text-gray-700" />
                </button>
                <h1 className="text-xl sm:text-2xl font-black font-newyork">Post</h1>
            </div>
            <FeedPostSkeleton />
        </div>
    );

    if (!post) return (
        <div className="flex flex-col items-center justify-center min-h-[500px] bg-[#fcf6de]">
            <h2 className="text-2xl font-black font-newyork text-gray-900">Post not found</h2>
            <Link href="/dashboard/feed" className="mt-4 text-[#ffc107] font-bold hover:underline">Back to feed</Link>
        </div>
    );

    const rootComments = comments.filter(c => !c.parent_id);

    return (
        <div className="min-h-screen bg-[#fcf6de] pb-52 sm:pb-64 selection:bg-[#ffc107]/30">
            <style>{heartPop}</style>
            <div className="max-w-[700px] mx-auto w-full px-0 sm:px-8 pt-0">
                {/* Header */}
                <div className="flex items-center gap-4 mt-4 sm:mt-6 mb-3 sm:mb-4 sticky top-0 py-2 bg-[#fcf6de]/95 backdrop-blur z-20 px-4 sm:px-0">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm active:scale-90"
                    >
                        <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5 text-gray-700" />
                    </button>
                    <h1 className="text-lg sm:text-xl font-black tracking-tight font-newyork text-gray-900 leading-tight">Post</h1>
                </div>

                {/* Main Post Content */}
                <div className="bg-[#fcf6de] border-b border-gray-100 p-4 sm:p-6 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <Link href={`/dashboard/profile/${post.author?.username}`}>
                                <Avatar
                                    src={post.author?.profile_picture}
                                    name={post.author?.display_name}
                                    className="w-10 h-10 rounded-full border-2 border-gray-100"
                                />
                            </Link>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-gray-900 text-[15px] tracking-tight">{post.author?.display_name}</span>
                                    <UserBadge
                                        isAdmin={post.author?.is_admin}
                                        isVerified={post.author?.is_verified}
                                        size="sm"
                                    />
                                </div>
                                <span className="text-gray-500 text-[13px] font-medium leading-none">@{post.author?.username}</span>
                            </div>
                        </div>

                        {/* More Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                            >
                                <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="w-5 h-5" />
                            </button>
                            {isMenuOpen && (
                                <div ref={menuRef} className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">
                                    {profile?.id === post.user_id ? (
                                        <button onClick={handleDeletePost} className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50">
                                            <HugeiconsIcon icon={Delete02Icon} className="w-4 h-4" /> Delete Post
                                        </button>
                                    ) : (
                                        <button onClick={() => openReportModal({ item_id: post.id, item_type: "feed" })} className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-orange-600 hover:bg-orange-50">
                                            <HugeiconsIcon icon={Alert01Icon} className="w-4 h-4" /> Report Post
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-3">
                        <Linkify text={post.content} className="text-gray-900 text-[1rem] sm:text-[1.1rem] leading-[1.5] font-semibold tracking-tight break-words pr-2" />
                    </div>

                    {post.media_url && (
                        <div className="relative mt-4 aspect-[4/5] rounded-[1.5rem] overflow-hidden bg-gray-50 border border-gray-100 shadow-inner group/media">
                            {post.media_url.match(/\.(mp4|webm|ogg|mov|m4v|3gp|mkv)$/i) ? (
                                <AutoPauseVideo 
                                    src={post.media_url} 
                                    poster={post.thumbnail_url}
                                    className="w-full h-full transition-transform duration-700 group-hover/media:scale-[1.01]" 
                                />
                            ) : (
                                <img 
                                    src={feedImageUrl(post.media_url)} 
                                    alt="Media" 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover/media:scale-[1.01]" 
                                    onClick={() => showImage(fullImageUrl(post.media_url))} 
                                />
                            )}
                        </div>
                    )}

                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-8 sm:px-4">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 group ${post.is_liked ? "text-red-500" : "text-gray-500 hover:text-red-500"}`}
                        >
                            <div className="w-10 h-10 flex items-center justify-center rounded-full group-hover:bg-red-50 transition-colors">
                                <HugeiconsIcon
                                    icon={FavouriteIcon}
                                    className={`w-6 h-6 transition-all duration-300 ${post.is_liked ? "fill-current animate-heart-pop" : "group-hover:scale-110"}`}
                                />
                            </div>
                            <span className="text-[15px] font-bold">{post.likes_count || 0}</span>
                        </button>

                        <button
                            onClick={() => {
                                setReplyingTo('root');
                                document.getElementById('root-reply-input')?.focus();
                            }}
                            className="flex items-center gap-2 group text-gray-500 hover:text-amber-500"
                        >
                            <div className="w-10 h-10 flex items-center justify-center rounded-full group-hover:bg-amber-50 transition-colors">
                                <HugeiconsIcon icon={Comment01Icon} className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                            </div>
                            <span className="text-[15px] font-bold">{post.comments_count || 0}</span>
                        </button>
                    </div>
                </div>

                {/* Fixed Bottom Reply Bar Container */}
                <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 pb-safe bg-gradient-to-t from-[#fcf6de] via-[#fcf6de] to-transparent z-40">
                    <div className="max-w-[700px] mx-auto">

                        {/* Reply Context Indicator */}
                        {replyContext && (
                            <div className={`mb-2 flex items-center justify-between bg-white/50 backdrop-blur px-4 py-1.5 rounded-t-xl border-x border-t border-gray-100/50 animate-in slide-in-from-bottom-2 duration-300`}>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Replying to <span className="text-gray-900">@{replyContext.username}</span>
                                </span>
                                <button
                                    onClick={() => {
                                        setReplyingTo(null);
                                        setReplyContext(null);
                                    }}
                                    className="p-1.5 hover:bg-black/5 rounded-full transition-colors"
                                >
                                    <HugeiconsIcon icon={Delete02Icon} className="w-3 h-3 text-gray-500" />
                                </button>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className={`bg-white p-3 sm:p-4 shadow-xl border border-gray-100 flex items-center gap-3 group focus-within:ring-4 focus-within:ring-[#ffc107]/10 transition-all duration-300 ${replyContext ? "rounded-b-2xl rounded-tr-2xl" : "rounded-[2rem]"}`}>
                            <Avatar src={profile?.profile_picture} className="w-10 h-10 rounded-full ring-2 ring-gray-50 transition-transform group-focus-within:scale-105" />
                            <input
                                ref={replyInputRef}
                                type="text"
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder={replyContext ? `Reply to ${replyContext.display_name}...` : "What's your reply?"}
                                className="flex-1 bg-transparent border-none outline-none py-2 sm:py-2.5 text-[15px] sm:text-[16px] font-medium text-gray-800 placeholder:text-gray-400"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleCommentSubmit(replyingTo);
                                }}
                            />
                            <button
                                onClick={() => handleCommentSubmit(replyingTo)}
                                disabled={!replyContent.trim() || submittingReply}
                                className="bg-[#ffc107] hover:bg-[#ffca2c] text-black w-10 h-10 sm:w-auto sm:px-8 sm:py-2.5 rounded-full font-black text-sm disabled:opacity-50 transition-all active:scale-95 shrink-0 shadow-sm flex items-center justify-center"
                            >
                                <span className="hidden sm:inline">{submittingReply ? "Posting..." : "Reply"}</span>
                                <span className="sm:hidden flex items-center justify-center">
                                    {submittingReply ? (
                                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <HugeiconsIcon icon={SentIcon} className="w-5 h-5" />
                                    )}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Comments List */}
                <div className="mt-2 divide-y divide-gray-100 pb-40">
                    {rootComments.length > 0 ? (
                        rootComments.map(comment => (
                            <Comment
                                key={comment.id}
                                comment={comment}
                                allComments={comments}
                                setReplyingTo={setReplyingTo}
                                setReplyContext={setReplyContext}
                                replyInputRef={replyInputRef}
                                profile={profile}
                                handleDeleteComment={handleDeleteComment}
                                formatDate={formatDate}
                            />
                        ))
                    ) : (
                        <div className="py-24 flex flex-col items-center justify-center text-center px-6 animate-in fade-in duration-1000">
                            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm border border-gray-50">
                                <HugeiconsIcon icon={Message01Icon} className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-black font-newyork text-gray-900">The hive is quiet</h3>
                            <p className="text-gray-500 font-bold mt-2 text-sm max-w-[200px]">
                                Be the first to start the conversation!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
