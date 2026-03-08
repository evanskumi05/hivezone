"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Search01Icon,
    ArrowRight01Icon,
    Cancel01Icon,
    Location01Icon,
    Message01Icon,
    Calendar01Icon
} from "@hugeicons/core-free-icons";
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import { getDisplayName } from '@/utils/stringUtils';
import FeedPostCard from "@/components/FeedPostCard";
import { useUI } from "@/components/ui/UIProvider";

function SearchResults() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [localQuery, setLocalQuery] = useState(query);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [profile, setProfile] = useState(null);
    const [activeTab, setActiveTab] = useState('profiles'); // 'profiles', 'gigs', 'feeds'
    const supabase = createClient();
    const { showToast, confirmAction, openReportModal } = useUI();

    // States for Feeds
    const [activeCommentId, setActiveCommentId] = useState(null);
    const [commentsData, setCommentsData] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [loadingComments, setLoadingComments] = useState({});

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                setCurrentUserId(session.user.id);
                const { data: profileData } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", session.user.id)
                    .single();
                setProfile(profileData);
            }
        };
        getSession();
    }, [supabase]);

    useEffect(() => {
        setLocalQuery(query);
        if (query.trim() && profile?.institution) {
            handleSearch(query.trim(), activeTab, profile.institution);
        } else if (!query.trim()) {
            setResults([]);
        }
    }, [query, activeTab, profile?.institution]);

    const handleSearch = async (searchTerm, tab, institution) => {
        setLoading(true);
        if (tab === 'profiles') {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('institution', institution)
                .or(`display_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
                .limit(20);

            if (error) {
                console.error('Search error:', error);
            } else {
                const formattedResults = (data || []).map(user => ({
                    ...user,
                    computedName: getDisplayName(user)
                }));
                setResults(formattedResults);
            }
        } else if (tab === 'gigs') {
            const { data, error } = await supabase
                .from('gigs')
                .select(`
                    *,
                    author:users!inner(id, display_name, profile_picture, is_verified, username, institution)
                `)
                .eq('author.institution', institution)
                .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
                .limit(20);

            if (!error) {
                setResults(data || []);
            } else {
                console.error('Search error:', error);
            }
        } else if (tab === 'feeds') {
            const { data, error } = await supabase
                .from('feeds')
                .select(`
                    *,
                    author:users!inner(display_name, username, profile_picture, is_verified, institution),
                    likes:feed_likes(user_id),
                    comments:feed_comments(count)
                `)
                .eq('author.institution', institution)
                .ilike('content', `%${searchTerm}%`)
                .order('created_at', { ascending: false })
                .limit(20);

            if (!error) {
                const processedPosts = (data || []).map(post => ({
                    ...post,
                    likes_count: post.likes?.length || 0,
                    comments_count: post.comments?.[0]?.count || 0,
                    is_liked: post.likes?.some(l => l.user_id === currentUserId)
                }));
                setResults(processedPosts);
            } else {
                console.error('Search error:', error);
            }
        }
        setLoading(false);
    };

    const onLocalSearch = (e) => {
        e.preventDefault();
        if (localQuery.trim()) {
            router.push(`/dashboard/search?q=${encodeURIComponent(localQuery.trim())}`);
        }
    };

    // --- Feed Handlers ---
    const handleDeletePost = async (postId, mediaUrl) => {
        const confirmed = await confirmAction({
            title: "Delete Post?",
            message: "Are you sure you want to remove this post? This action cannot be undone.",
            confirmText: "Delete",
            cancelText: "Cancel",
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
                        await supabase.storage.from(bucketName).remove([filePath]);
                    }
                } catch (e) {
                    console.error("Extraction failed:", e);
                }
            }

            const { error: postError } = await supabase.from('feeds').delete().eq('id', postId);
            if (postError) throw postError;

            setResults(results.filter(p => p.id !== postId));
            showToast("Post deleted successfully!");
        } catch (error) {
            console.error("Error deleting post:", error);
            showToast("Failed to delete post. Please try again.", "error");
        }
    };

    const handleReportPost = async (post) => {
        openReportModal({
            item_id: post.id,
            item_type: 'feed'
        });
    };

    const handleLike = async (post) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const isLiked = post.is_liked;
            const postId = post.id;

            setResults(prev => prev.map(p =>
                p.id === postId
                    ? { ...p, is_liked: !isLiked, likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1 }
                    : p
            ));

            if (isLiked) {
                await supabase.from('feed_likes').delete().eq('feed_id', postId).eq('user_id', session.user.id);
            } else {
                await supabase.from('feed_likes').insert([{ feed_id: postId, user_id: session.user.id }]);

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
            setResults(prev => prev.map(p =>
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
                    author:users(display_name, username, profile_picture)
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

    const toggleComments = (postId) => {
        if (activeCommentId === postId) {
            setActiveCommentId(null);
        } else {
            setActiveCommentId(postId);
            fetchComments(postId);
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
                    author:users(display_name, username, profile_picture)
                `)
                .single();

            if (error) throw error;

            setCommentsData(prev => ({
                ...prev,
                [postId]: [...(prev[postId] || []), newComment]
            }));
            setCommentInputs(prev => ({ ...prev, [postId]: "" }));

            setResults(prev => prev.map(p =>
                p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
            ));

            const post = results.find(p => p.id === postId);
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
                    const { error } = await supabase.from('feed_comments').delete().eq('id', commentId);
                    if (error) throw error;

                    setCommentsData(prev => ({
                        ...prev,
                        [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
                    }));

                    setResults(prev => prev.map(p =>
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

    return (
        <div className="flex flex-col min-h-screen bg-[#fcf6de] md:bg-[#fcf6de] pb-32 pt-4 md:pt-8 w-full">
            <div className="max-w-4xl mx-auto w-full px-4 md:px-8">

                {/* Mobile Search Bar */}
                <div className="md:hidden mb-6">
                    <form onSubmit={onLocalSearch} className="relative flex items-center">
                        <input
                            type="text"
                            placeholder="search your hive..."
                            value={localQuery}
                            onChange={(e) => setLocalQuery(e.target.value)}
                            className="w-full h-14 pl-5 pr-12 bg-white border border-gray-200 rounded-2xl text-[16px] outline-none shadow-sm placeholder:text-gray-400 font-medium focus:border-[#ffc107] transition-all"
                        />
                        <button type="submit" className="absolute right-4">
                            <HugeiconsIcon icon={Search01Icon} className="w-6 h-6 text-gray-400" strokeWidth={2} />
                        </button>
                    </form>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-black font-newyork text-gray-900 leading-none">
                            Search Results
                        </h1>
                        <p className="text-gray-500 font-medium text-sm mt-2">
                            {query ? `Showing results for "${query}"` : "Search for content in your hive"}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6 sticky top-[72px] bg-[#fcf6de] z-10 pt-2 pb-0">
                    {['profiles', 'gigs', 'feeds'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 pb-3 text-center text-sm font-bold transition-all border-b-2 capitalize ${activeTab === tab
                                ? 'border-[#ffc107] text-gray-900'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Results List */}
                <div className="flex flex-col gap-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-[#ffc107] border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-500 font-bold text-sm">Searching the hive...</p>
                        </div>
                    ) : results.length > 0 ? (
                        <>
                            {activeTab === 'profiles' && (
                                <div className="flex flex-col gap-4">
                                    {results.map((user) => (
                                        <Link
                                            href={user.id === currentUserId ? '/dashboard/profile' : `/dashboard/profile/${user.username || user.id}`}
                                            key={user.id}
                                            className="bg-white p-4 rounded-3xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:border-[#ffc107] transition-all group active:scale-[0.98]"
                                        >
                                            <div className="shrink-0">
                                                <Avatar
                                                    src={user.profile_picture}
                                                    name={user.computedName || "?"}
                                                    className="w-14 h-14 rounded-full border border-gray-100"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-black text-gray-900 truncate">
                                                    {user.computedName}
                                                </h3>
                                                <p className="text-xs font-bold text-gray-500">@{user.username || 'user'}</p>
                                                {user.bio && (
                                                    <p className="text-xs text-gray-400 truncate mt-1">{user.bio}</p>
                                                )}
                                            </div>
                                            <HugeiconsIcon
                                                icon={ArrowRight01Icon}
                                                className="w-5 h-5 text-gray-300 group-hover:text-[#ffc107] transition-colors"
                                                strokeWidth={1.5}
                                            />
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'gigs' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                                    {results.map((gig) => (
                                        <div
                                            key={gig.id}
                                            className={`rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col gap-4 bg-white hover:shadow-md transition-shadow cursor-pointer`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 bg-gray-200 shrink-0 relative">
                                                    <Avatar
                                                        src={gig.author?.profile_picture}
                                                        name={gig.author?.display_name || "Author"}
                                                        className="w-full h-full"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 text-sm">{gig.author?.display_name}</span>
                                                    <span className="text-[11px] text-gray-500 font-medium">
                                                        {new Date(gig.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="ml-auto font-black text-lg text-gray-900 bg-yellow-50 px-3 py-1 rounded-full">
                                                    ¢{gig.price}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 flex-grow">
                                                <h3 className="text-xl font-bold text-gray-900 leading-tight">
                                                    {gig.title}
                                                </h3>
                                                <p className="text-sm text-gray-700 line-clamp-3 font-medium">
                                                    {gig.description}
                                                </p>
                                            </div>

                                            <div className="flex flex-col gap-3 mt-2 pt-4 border-t border-black/5">
                                                <div className="flex items-center gap-2 text-xs text-gray-600 font-semibold">
                                                    <HugeiconsIcon icon={Location01Icon} className="w-4 h-4" />
                                                    {gig.location}
                                                </div>
                                                {gig.expected_due_date && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-600 font-semibold">
                                                        <HugeiconsIcon icon={Calendar01Icon} className="w-4 h-4 text-orange-500" />
                                                        Due: {new Date(gig.expected_due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                )}
                                                <div className="flex flex-wrap gap-2">
                                                    {gig.tags && gig.tags.map((tag, idx) => (
                                                        <span key={idx} className="bg-gray-100 text-gray-800 text-[11px] font-bold px-3 py-1 rounded-full">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex gap-3 mt-2">
                                                <Link
                                                    href={`/dashboard/gigs/detail?id=${gig.id}`}
                                                    className="flex-1 bg-black text-white hover:bg-gray-800 text-sm font-semibold py-3 rounded-full transition-colors active:scale-95 shadow-sm text-center flex items-center justify-center"
                                                >
                                                    View Details
                                                </Link>
                                                {gig.author?.id !== currentUserId && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/dashboard/chat/new?user=${gig.author.id}&gig=${gig.id}`);
                                                        }}
                                                        className="w-12 h-12 bg-white flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors shadow-sm border border-gray-100 shrink-0"
                                                        title="Book Gig"
                                                    >
                                                        <HugeiconsIcon icon={Message01Icon} className="w-5 h-5 text-gray-700" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'feeds' && (
                                <div className="flex flex-col gap-4 pb-12">
                                    {results.map((post) => (
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
                                    ))}
                                </div>
                            )}
                        </>
                    ) : query.trim() ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                <HugeiconsIcon icon={Cancel01Icon} className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-black font-newyork text-gray-900">No {activeTab} found</h3>
                            <p className="text-gray-500 text-sm mt-1 max-w-[240px]">
                                We couldn't find any {activeTab} matching "{query}". Try a different spelling.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
                            <HugeiconsIcon icon={Search01Icon} className="w-12 h-12 mb-4 opacity-20" strokeWidth={1.5} />
                            <p className="font-bold text-sm">What are you looking for?</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-[#fcf6de]">
                <div className="w-10 h-10 border-4 border-[#ffc107] border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <SearchResults />
        </Suspense>
    );
}
