"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare02Icon, Flag01Icon, CheckmarkBadge01Icon, MoreHorizontalCircle01Icon, Delete02Icon, Alert01Icon, FavouriteIcon, Comment01Icon } from "@hugeicons/core-free-icons";
import { ProfileSkeleton } from "@/components/ui/Skeleton";
import Avatar from "@/components/ui/Avatar";
import { getDisplayName } from "@/utils/stringUtils";
import { useUI } from "@/components/ui/UIProvider";
import FeedPostCard from "@/components/FeedPostCard";

export default function PublicProfilePage() {
    const router = useRouter();
    const params = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const { openReportModal, showToast, showImage } = useUI();

    // Tabs state
    const [activeTab, setActiveTab] = useState("posts"); // 'posts' | 'gigs'
    const [userPosts, setUserPosts] = useState([]);
    const [userGigs, setUserGigs] = useState([]);
    const [loadingContent, setLoadingContent] = useState(false);

    // Feed interactions state
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    const [activeCommentId, setActiveCommentId] = useState(null);
    const [commentsData, setCommentsData] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [loadingComments, setLoadingComments] = useState({});

    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            if (!params?.username) return;

            // Get current session for redirection logic
            const { data: { session } } = await supabase.auth.getSession();
            const loggedInId = session?.user?.id;
            setCurrentUserId(loggedInId);

            if (loggedInId) {
                const { data: currProfile } = await supabase.from('users').select('*').eq('id', loggedInId).single();
                setCurrentUserProfile(currProfile);
            }

            // Fetch profile data from public.users table using the URL parameter
            const { data: profileData, error } = await supabase
                .from("users")
                .select("*")
                .ilike("username", params.username)
                .single();

            if (error || !profileData) {
                console.error("Error fetching public user profile:", error);
                setNotFound(true);
            } else {
                // REDIRECTION LOGIC: If this is the logged in user's own profile, go to the editable one
                if (loggedInId && profileData.id === loggedInId) {
                    router.replace("/dashboard/profile");
                    return;
                }
                setProfile(profileData);
                fetchUserContent(profileData.id);
            }

            setLoading(false);
        };

        fetchUser();
    }, [params?.username, supabase]);

    const fetchUserContent = async (userId) => {
        setLoadingContent(true);
        try {
            // Fetch user's posts
            const { data: postsData } = await supabase
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
                .eq("user_id", userId)
                .order("created_at", { ascending: false });

            // Fetch user's gigs
            const { data: gigsData } = await supabase
                .from("gigs")
                .select(`
                    *,
                    author:users!inner (
                        display_name,
                        profile_picture,
                        is_verified,
                        username
                    )
                `)
                .eq("user_id", userId)
                .order("created_at", { ascending: false });

            // Get current session for like status
            const { data: { session } } = await supabase.auth.getSession();
            const loggedInId = session?.user?.id;

            const processedPosts = postsData?.map(post => ({
                ...post,
                likes_count: post.likes?.length || 0,
                comments_count: post.comments?.[0]?.count || 0,
                is_liked: post.likes?.some(l => l.user_id === loggedInId)
            })) || [];

            setUserPosts(processedPosts);
            setUserGigs(gigsData || []);
        } catch (error) {
            console.error("Error fetching user content:", error);
        } finally {
            setLoadingContent(false);
        }
    };

    const handleReportPost = async (post) => {
        openReportModal({
            item_id: post.id,
            item_type: "feed"
        });
    };

    const handleLike = async (post) => {
        try {
            const isLiked = post.is_liked;
            const postId = post.id;

            // Optimistic update
            setUserPosts(prev => prev.map(p =>
                p.id === postId
                    ? { ...p, is_liked: !isLiked, likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1 }
                    : p
            ));

            if (isLiked) {
                await supabase.from('feed_likes').delete().eq('feed_id', postId).eq('user_id', currentUserId);
            } else {
                await supabase.from('feed_likes').insert([{ feed_id: postId, user_id: currentUserId }]);

                // Notification logic
                if (post.user_id !== currentUserId) {
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
                            title: currentUserProfile?.display_name || currentUserProfile?.first_name || 'User',
                            message: "liked your post",
                            url: `${window.location.origin}/dashboard/feed`
                        })
                    }).catch(err => console.error("Push notification failed:", err));
                }
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            // Revert on error
            setUserPosts(prev => prev.map(p =>
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
        } finally {
            setLoadingComments(prev => ({ ...prev, [postId]: false }));
        }
    };

    const handleCommentSubmit = async (postId) => {
        const content = commentInputs[postId];
        if (!content?.trim()) return;

        try {
            const { data: newComment, error } = await supabase
                .from('feed_comments')
                .insert([{
                    feed_id: postId,
                    user_id: currentUserId,
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
            setUserPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
            ));

            // Notification logic
            const post = userPosts.find(p => p.id === postId);
            if (post && post.user_id !== currentUserId) {
                await supabase.from('notifications').insert({
                    user_id: post.user_id,
                    actor_id: currentUserId,
                    type: 'comment',
                    entity_type: 'feed',
                    entity_id: postId,
                    message: `commented on your post`
                });

                fetch('/api/notifications/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userIds: [post.user_id],
                        title: currentUserProfile?.display_name || currentUserProfile?.first_name || 'User',
                        message: `commented on your post\n"${content.trim()}"`,
                        url: `${window.location.origin}/dashboard/feed`
                    })
                }).catch(err => console.error("Push notification failed:", err));
            }

        } catch (error) {
            console.error("Error posting comment:", error);
        }
    };

    const handleDeleteComment = async (commentId, postId) => {
        try {
            const { error } = await supabase
                .from('feed_comments')
                .delete()
                .eq('id', commentId);

            if (error) throw error;

            setCommentsData(prev => ({
                ...prev,
                [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
            }));

            setUserPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, comments_count: Math.max(0, (p.comments_count || 1) - 1) } : p
            ));
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };

    const toggleComments = (postId) => {
        if (activeCommentId === postId) {
            setActiveCommentId(null);
        } else {
            setActiveCommentId(postId);
            fetchComments(postId);
        }
    };

    const handleDeletePost = async (postId, mediaUrl) => {
        try {
            const { error } = await supabase
                .from('feeds')
                .delete()
                .eq('id', postId);

            if (error) throw error;

            setUserPosts(prev => prev.filter(p => p.id !== postId));
        } catch (error) {
            console.error("Error deleting post:", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white md:bg-[#fcf6de]">
                <ProfileSkeleton />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-32px)] w-full items-center justify-center bg-white md:bg-[#fcf6de] text-center px-4">
                <h1 className="text-4xl font-black font-newyork text-gray-900 mb-2">User Not Found</h1>
                <p className="text-gray-500 font-medium">The profile "@{(params?.username)?.toString()}" does not exist or has been removed.</p>
                <button onClick={() => router.push('/dashboard')} className="mt-6 px-6 py-2 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors">
                    Return to Dashboard
                </button>
            </div>
        );
    }

    // Safely parse skills
    const parseStringList = (str) => {
        if (!str || typeof str !== 'string' || str.trim() === '') return [];
        const cleanStr = str.replace(/[\[\]"']/g, '').replace(/\n/g, ',');
        return cleanStr.split(',').map(s => s.trim()).filter(s => s);
    };

    const skillsList = Array.isArray(profile?.skills)
        ? profile.skills
        : parseStringList(profile?.skills);

    // Normalize portfolio link to ensure it starts with http:// or https://
    const getValidUrl = (url) => {
        if (!url || url.trim() === "") return "";
        const trimmedUrl = url.trim();
        if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
            return trimmedUrl;
        }
        return `https://${trimmedUrl}`;
    };

    const singlePortfolioLink = profile?.portfolio_links?.trim() || "";
    const portfolioUrl = getValidUrl(singlePortfolioLink);

    return (
        <div className="flex flex-col h-full bg-white md:bg-[#fcf6de] md:p-4 lg:p-8 md:pt-0 max-w-[950px] mx-auto w-full">

            {/* Main Content Layout */}
            <div className="flex-1 overflow-y-auto scrollbar-hide pb-20 md:pb-10 w-full">
                <div className="bg-white md:bg-[#f4f4f4] md:rounded-[2.5rem] w-full min-h-[85vh] flex flex-col overflow-hidden relative md:border md:border-gray-200 md:shadow-sm">

                    {/* Cover Photo Area */}
                    <div className="h-32 sm:h-48 md:h-72 w-full relative">
                        {profile?.cover_photo ? (
                            <img
                                src={profile.cover_photo}
                                alt="Cover Photo"
                                className="w-full h-full object-cover object-center md:rounded-t-[2.5rem] cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() => showImage(profile.cover_photo)}
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-200 md:rounded-t-[2.5rem]"></div>
                        )}
                    </div>

                    {/* Profile Section */}
                    <div className="relative px-4 sm:px-8 md:px-12 pb-12 flex-1">

                        {/* Avatar overlapping cover */}
                        <div className="absolute -top-10 sm:-top-16 left-4 sm:left-8 md:left-12 z-30">
                            <div 
                                className="w-[84px] h-[84px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] rounded-full border-[4px] md:border-[6px] border-white md:border-[#f4f4f4] overflow-hidden bg-gray-200 shadow-sm relative cursor-pointer hover:scale-105 transition-transform duration-300 active:scale-95"
                                onClick={() => showImage(profile?.profile_picture)}
                            >
                                <Avatar
                                    src={profile?.profile_picture}
                                    name="Profile Avatar"
                                    className="w-full h-full"
                                />
                            </div>
                        </div>

                        {/* Top row: Message + Report buttons */}
                        <div className="w-full flex justify-end items-center gap-2 pt-3 md:pt-6">
                            <button
                                onClick={() => {
                                    router.push(`/dashboard/chat/new?user=${profile.id}`);
                                }}
                                className="px-4 py-1.5 md:px-6 md:py-2 rounded-full border border-gray-300 md:border-[#ffc107] bg-white md:bg-[#ffc107] text-gray-900 md:text-black font-bold text-[13px] md:text-[15px] hover:bg-gray-50 md:hover:bg-[#ffb300] transition-colors shadow-sm"
                            >
                                Message
                            </button>
                            <button
                                onClick={() => openReportModal({ item_id: profile.id, item_type: 'user' })}
                                className="p-2 rounded-full border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors"
                                title="Report user"
                            >
                                <HugeiconsIcon icon={Flag01Icon} size={16} />
                            </button>
                        </div>

                        {/* Main Grid: Info + Banner on Left, Skills+Links on Right */}
                        <div className="mt-2 md:mt-2 grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8 md:gap-16 lg:gap-32 w-full max-w-5xl relative z-10">

                            {/* Left Column (Info) */}
                            <div className="flex flex-col mt-2 md:mt-0">
                                {/* Info Block */}
                                <h1 className="text-[26px] md:text-3xl sm:text-[34px] font-black font-newyork text-gray-900 tracking-tight leading-none">
                                    {getDisplayName(profile, "User")}
                                </h1>
                                <span className="text-[14px] font-medium mt-1 text-gray-500">
                                    {profile?.username ? `@${profile.username}` : ""}
                                </span>

                                <div className="flex flex-col text-[13px] text-gray-600 font-medium mt-3 gap-0.5">
                                    <span>{profile?.institution || ""}</span>
                                    <span>{profile?.programme || ""}</span>
                                    {profile?.year_of_study && (
                                        <span>{profile.year_of_study}</span>
                                    )}
                                </div>

                                <p className="text-[13px] text-gray-600 font-medium mt-4 leading-relaxed pr-8">
                                    {profile?.bio || ""}
                                </p>
                            </div>

                            {/* Right Column (Skills, Portfolio) */}
                            <div className="flex flex-col gap-8 pt-2 md:pt-1">
                                {skillsList.length > 0 && (
                                    <div>
                                        <h3 className="text-[19px] font-black font-newyork text-gray-900 mb-3 tracking-wide">Skills</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <div className="px-4 py-1.5 rounded-full border border-[#ffc107] text-[13px] font-semibold flex items-center bg-[#fdfdfd] shadow-sm">
                                                {skillsList.map((skill, index) => (
                                                    <React.Fragment key={index}>
                                                        <span className="text-gray-500">{skill}</span>
                                                        {index < skillsList.length - 1 && <div className="w-px h-3.5 bg-gray-300 mx-2.5"></div>}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {singlePortfolioLink && (
                                    <div>
                                        <h3 className="text-[19px] font-black font-newyork text-gray-900 mb-3 tracking-wide">Portfolio Link</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <a
                                                href={portfolioUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-1.5 rounded-full border border-[#ffc107] text-[#ffb300] hover:text-[#e09e00] text-[13px] font-bold flex items-center gap-2 bg-[#fdfdfd] shadow-sm hover:bg-[#fcfcfc] transition-colors"
                                            >
                                                <HugeiconsIcon icon={LinkSquare02Icon} className="w-4 h-4" />
                                                <span>{singlePortfolioLink}</span>
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Tabs Switcher */}
                        <div className="mt-12 border-b border-gray-100 flex items-center gap-8 px-2 overflow-x-auto scrollbar-hide">
                            <button
                                onClick={() => setActiveTab("posts")}
                                className={`pb-3 px-1 font-black text-[15px] transition-all relative shrink-0 ${activeTab === "posts" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
                            >
                                Posts
                                {activeTab === "posts" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#ffc107] rounded-full" />}
                            </button>
                            <button
                                onClick={() => setActiveTab("gigs")}
                                className={`pb-3 px-1 font-black text-[15px] transition-all relative shrink-0 ${activeTab === "gigs" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
                            >
                                Gigs
                                {activeTab === "gigs" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#ffc107] rounded-full" />}
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="mt-8">
                            {loadingContent ? (
                                <div className="flex justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-[#ffc107] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : activeTab === "posts" ? (
                                <div className="space-y-4">
                                    {userPosts.length > 0 ? (
                                        userPosts.map(post => (
                                            <FeedPostCard
                                                key={post.id}
                                                post={post}
                                                profile={currentUserProfile}
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
                                        <div className="py-20 text-center text-gray-400 font-bold">No posts yet.</div>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {userGigs.length > 0 ? (
                                        userGigs.map(gig => (
                                            <Link
                                                key={gig.id}
                                                href={`/dashboard/gigs/detail?id=${gig.id}`}
                                                className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100 flex flex-col justify-between hover:border-[#ffc107] transition-colors group"
                                            >
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-black text-gray-900 text-[17px] leading-tight group-hover:text-[#ffc107] transition-colors">{gig.title}</h4>
                                                        <span className="font-black text-[#ffb300]">¢{gig.price}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 line-clamp-2 mb-4 font-medium">{gig.description}</p>
                                                </div>
                                                <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                                    {new Date(gig.created_at).toLocaleDateString()}
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-20 text-center text-gray-400 font-bold">No gigs yet.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
