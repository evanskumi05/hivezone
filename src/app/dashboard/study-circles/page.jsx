"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Search01Icon,
    ArrowLeft01Icon,
    SentIcon,
    Attachment01Icon,
    Image01Icon,
    Menu01Icon,
    Cancel01Icon,
    UserGroupIcon,
    PinIcon,
    Add01Icon,
    InformationCircleIcon,
    Tick01Icon,
    LeftToRightListDashIcon,
    Delete02Icon,
    Link01Icon,
    LockIcon,
    LicenseIcon,
    MoreVerticalIcon,
    Logout01Icon
} from "@hugeicons/core-free-icons";
import Avatar from "@/components/ui/Avatar";
import { useUI } from "@/components/ui/UIProvider";

const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
    }).format(new Date(date));
};

// Helper to generate a random invite code
const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export default function StudyCirclesPage() {
    const { showToast, confirmAction } = useUI();
    const supabase = createClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("my"); // "my" or "discover"
    const [profile, setProfile] = useState(null);
    const [myCircles, setMyCircles] = useState([]);
    const [discoverCircles, setDiscoverCircles] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isJoiningCode, setIsJoiningCode] = useState(false);
    const [joinViaCode, setJoinViaCode] = useState("");

    const [activeCircleId, setActiveCircleId] = useState(null);
    const [isMobileListVisible, setIsMobileListVisible] = useState(true);

    const [newMessage, setNewMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);

    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const router = useRouter();

    // Auto-scroll to bottom of active chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                loadUserData(session.user.id);
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                loadUserData(session.user.id);
            }
        });

        fetchInitialData();
        return () => subscription.unsubscribe();
    }, []);

    const loadUserData = async (userId) => {
        try {
            // Fetch Profile
            const { data: profileData, error: profileError } = await supabase
                .from("users")
                .select("*")
                .eq("id", userId)
                .single();

            if (profileError) {
                // Silently fail or handle gracefully
            }
            setProfile(profileData);

            // Fetch My Circles
            fetchMyCircles(userId);
            // Fetch Discoverable Circles
            fetchDiscoverCircles(userId);
        } catch (err) {
            // Handle error silently
        }
    };

    const fetchMyCircles = async (userId) => {
        setLoading(true);
        // Fetch joined circles and their member counts
        const { data, error } = await supabase
            .from("study_circle_members")
            .select(`
                circle_id,
                study_circles (*)
            `)
            .eq("user_id", userId);


        if (error) {
            setLoading(false);
            return;
        }

        if (data) {
            // For each circle, fetch member count separately to keep it simple and reliable
            const formatted = await Promise.all(data.map(async (item) => {
                const { count } = await supabase
                    .from("study_circle_members")
                    .select("*", { count: 'exact', head: true })
                    .eq("circle_id", item.circle_id);

                // Handle both object and array return formats from Supabase
                const circleInfo = Array.isArray(item.study_circles) ? item.study_circles[0] : item.study_circles;

                if (!circleInfo) {
                    return null;
                }

                return {
                    ...circleInfo,
                    member_count: count || 0,
                    unread: 0,
                    last_message: circleInfo.last_message || "No messages yet",
                    timestamp: circleInfo.last_message_at
                        ? formatDate(circleInfo.last_message_at)
                        : formatDate(circleInfo.created_at || new Date())
                };
            }));

            // Filter out any nulls if mapping failed
            const validCircles = formatted.filter(Boolean);

            // Sort by most recent activity
            const sorted = validCircles.sort((a, b) => {
                const dateA = new Date(a.last_message_at || a.created_at);
                const dateB = new Date(b.last_message_at || b.created_at);
                return dateB - dateA;
            });

            setMyCircles(sorted);
        }
        setLoading(false);
    };

    const fetchDiscoverCircles = async (userId) => {
        const { data: joinedIds } = await supabase
            .from("study_circle_members")
            .select("circle_id")
            .eq("user_id", userId);

        const joinedIdList = joinedIds?.map(j => j.circle_id) || [];

        let query = supabase.from("study_circles").select("*")
            .eq("is_private", false); // Only discover public circles

        if (joinedIdList.length > 0) {
            query = query.not("id", "in", `(${joinedIdList.join(",")})`);
        }

        const { data, error } = await query;
        if (error) {
            return;
        }

        if (data) {
            // Fetch counts for discoverable circles too
            const formatted = await Promise.all(data.map(async (circle) => {
                const { count } = await supabase
                    .from("study_circle_members")
                    .select("*", { count: 'exact', head: true })
                    .eq("circle_id", circle.id);
                return { ...circle, member_count: count || 0 };
            }));
            setDiscoverCircles(formatted);
        }
    };

    const handleJoinViaCode = async (e) => {
        e.preventDefault();
        if (!joinViaCode.trim() || !profile) return;

        setIsJoiningCode(true);
        const { data, error } = await supabase
            .from("study_circles")
            .select("id, name")
            .eq("invite_code", joinViaCode.trim().toUpperCase())
            .single();

        if (error || !data) {
            showToast("Invalid invite code", "error");
        } else {
            // Check if already a member
            const { data: membership } = await supabase
                .from("study_circle_members")
                .select("*")
                .eq("circle_id", data.id)
                .eq("user_id", profile.id)
                .single();

            if (membership) {
                showToast(`You are already a member of ${data.name}`, "info");
            } else {
                const { error: joinError } = await supabase
                    .from("study_circle_members")
                    .insert({
                        circle_id: data.id,
                        user_id: profile.id
                    });

                if (!joinError) {
                    showToast(`Joined ${data.name}!`, "success");
                    setJoinViaCode("");
                    fetchMyCircles(profile.id);
                    setActiveTab("my");
                    setActiveCircleId(data.id);
                } else {
                    showToast("Failed to join circle", "error");
                }
            }
        }
        setIsJoiningCode(false);
    };

    // Fetch messages when active circle changes
    useEffect(() => {
        if (!activeCircleId || activeTab !== "my") return;

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from("study_circle_messages")
                .select(`
                    *,
                    author:users (display_name, profile_picture)
                `)
                .eq("circle_id", activeCircleId)
                .order("created_at", { ascending: true });

            if (error) {
                // Handle error
            }

            if (!error) {
                setMessages(data.map(m => ({
                    id: m.id,
                    sender: m.author?.display_name || "Unknown",
                    text: m.content,
                    timestamp: formatDate(m.created_at),
                    avatar: m.author?.profile_picture,
                    user_id: m.user_id
                })));
                setTimeout(scrollToBottom, 100);
            }
        };

        fetchMessages();

        // Realtime subscription
        const channel = supabase
            .channel(`circle-${activeCircleId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'study_circle_messages',
                filter: `circle_id=eq.${activeCircleId}`
            }, async (payload) => {
                // Fetch author details for the new message
                const { data: authorData } = await supabase
                    .from("users")
                    .select("display_name, profile_picture")
                    .eq("id", payload.new.user_id)
                    .single();

                const newMsg = {
                    id: payload.new.id,
                    sender: authorData?.display_name || "Unknown",
                    text: payload.new.content,
                    timestamp: formatDate(payload.new.created_at),
                    avatar: authorData?.profile_picture,
                    user_id: payload.new.user_id
                };

                setMessages(prev => {
                    // Avoid duplicates if already optimistically added
                    if (prev.some(m => m.id === newMsg.id || (m.text === newMsg.text && m.user_id === newMsg.user_id && m.id.toString().startsWith('temp-')))) {
                        return prev.map(m => (m.text === newMsg.text && m.user_id === newMsg.user_id) ? newMsg : m);
                    }
                    return [...prev, newMsg];
                });

                // Update last message in sidebar
                setMyCircles(prev => prev.map(c =>
                    c.id === activeCircleId
                        ? { ...c, last_message: `${newMsg.sender}: ${newMsg.text}`, last_message_at: payload.new.created_at, timestamp: formatDate(payload.new.created_at) }
                        : c
                ).sort((a, b) => new Date(b.last_message_at || b.created_at) - new Date(a.last_message_at || a.created_at)));

                setTimeout(scrollToBottom, 100);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeCircleId, activeTab]);

    // Handle Escape key to close active chat and handle browser back button
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" || e.keyCode === 27) {
                if (!isMobileListVisible) {
                    window.history.back(); // Triggers popstate
                } else {
                    setActiveCircleId(null);
                }
            }
        };

        const handlePopState = (e) => {
            if (!isMobileListVisible) {
                setIsMobileListVisible(true);
                setActiveCircleId(null); // Clear highlight when closing on mobile
            }
        };

        window.addEventListener("keydown", handleKeyDown, true);
        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("keydown", handleKeyDown, true);
            window.removeEventListener("popstate", handlePopState);
        };
    }, [isMobileListVisible]);

    const openCircle = (id) => {
        setActiveCircleId(id);
        if (isMobileListVisible && window.innerWidth < 768) {
            setIsMobileListVisible(false); // Hide list on mobile
            window.history.pushState({ chatOpen: true }, "", window.location.href);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !profile || !activeCircleId) return;

        const tempMessage = {
            id: 'temp-' + Date.now(),
            sender: profile.display_name,
            text: newMessage,
            timestamp: formatDate(new Date()),
            avatar: profile.profile_picture,
            user_id: profile.id
        };

        // UI Optimistic update
        setMessages(prev => [...prev, tempMessage]);

        // Sidebar Optimistic update
        setMyCircles(prev => prev.map(c =>
            c.id === activeCircleId
                ? { ...c, last_message: `You: ${newMessage}`, last_message_at: new Date().toISOString(), timestamp: formatDate(new Date()) }
                : c
        ).sort((a, b) => new Date(b.last_message_at || b.created_at) - new Date(a.last_message_at || a.created_at)));

        const msgText = newMessage;
        setNewMessage("");
        setTimeout(scrollToBottom, 100);

        const { error } = await supabase
            .from("study_circle_messages")
            .insert({
                circle_id: activeCircleId,
                user_id: profile.id,
                content: msgText
            });

        // Update circle activity in DB (manual sync)
        await supabase
            .from("study_circles")
            .update({
                last_message: `${profile.display_name}: ${msgText}`,
                last_message_at: new Date().toISOString()
            })
            .eq("id", activeCircleId);

        if (error) {
            showToast("Failed to send message", "error");
            // Remove temp message on error
            setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        }
    };

    const handleJoinCircle = async (circleId) => {
        if (!profile) return;

        const { error } = await supabase
            .from("study_circle_members")
            .insert({
                circle_id: circleId,
                user_id: profile.id
            });

        if (!error) {
            showToast("Joined Study Circle!", "success");
            fetchMyCircles(profile.id);
            fetchDiscoverCircles(profile.id);
            setActiveTab("my");
            setActiveCircleId(circleId);
        } else {
            showToast("Failed to join circle", "error");
        }
    };

    const handleLeaveCircle = async (circleId) => {
        if (!profile) return;

        confirmAction({
            title: "Leave Study Circle",
            message: "Are you sure you want to leave this study circle? You won't receive updates anymore.",
            confirmText: "Leave",
            cancelText: "Stay",
            action: async () => {
                const { error } = await supabase
                    .from("study_circle_members")
                    .delete()
                    .eq("circle_id", circleId)
                    .eq("user_id", profile.id);

                if (!error) {
                    showToast("Left Study Circle", "success");
                    fetchMyCircles(profile.id);
                    fetchDiscoverCircles(profile.id);
                    setActiveCircleId(null);
                    if (window.innerWidth < 768) {
                        setIsMobileListVisible(true);
                    }
                } else {
                    showToast("Failed to leave circle", "error");
                }
            }
        });
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMoreMenuOpen(false);
            }
        };

        if (isMoreMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isMoreMenuOpen]);

    const activeCircleData = [...myCircles, ...discoverCircles].find(c => c.id === activeCircleId);
    const displayedList = activeTab === "my"
        ? myCircles.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.course?.toLowerCase().includes(searchQuery.toLowerCase()))
        : discoverCircles.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.course?.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-32px)] md:min-h-[750px] bg-white md:bg-[#fcf6de] md:px-4 sm:px-8 md:gap-4 max-w-[1400px] mx-auto w-full md:pb-4">

            {/* Header */}
            <div className={`flex items-center justify-between mt-2 md:mt-4 px-4 md:px-0 shrink-0 ${!isMobileListVisible ? 'hidden md:flex' : ''}`}>
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5 text-gray-700" />
                    </Link>
                    <h1 className="text-3xl font-black tracking-wide font-newyork text-gray-900 hidden sm:block">
                        Study Circles
                    </h1>
                </div>
                <Link
                    href="/dashboard/study-circles/create"
                    className="bg-black text-white hover:bg-gray-800 font-bold text-[13px] px-5 py-2.5 rounded-full transition-colors active:scale-95 shadow-sm flex items-center gap-2"
                >
                    <HugeiconsIcon icon={Add01Icon} className="w-4 h-4" />
                    Create Circle
                </Link>
            </div>

            {/* Side-by-Side Container */}
            <div className="bg-white md:rounded-[2rem] md:shadow-sm md:border border-gray-100 flex flex-1 overflow-hidden relative mt-2 md:mt-0">

                {/* LEFT PANEL: Circle List */}
                <div className={`w-full md:w-[380px] lg:w-[420px] flex-col border-r border-gray-100 bg-white z-10 
                    ${isMobileListVisible ? 'flex' : 'hidden md:flex'} h-full`}>

                    {/* Header & Search */}
                    <div className="p-6 pb-2 border-b border-gray-100 shrink-0 flex flex-col gap-4">
                        <div className="flex items-center justify-between md:hidden">
                            <h2 className="text-2xl font-black font-newyork text-gray-900 mb-1">Study Circles</h2>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search circles or topics..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-full text-sm outline-none placeholder:text-gray-400 font-medium focus:border-[#ffc107] focus:bg-white transition-colors"
                            />
                            <HugeiconsIcon icon={Search01Icon} className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        </div>

                        {/* Tab Switcher */}
                        <div className="flex bg-gray-100 p-1 rounded-full w-full">
                            <button
                                onClick={() => setActiveTab('my')}
                                className={`flex-1 py-1.5 text-sm font-bold rounded-full transition-colors ${activeTab === 'my' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                My Circles
                            </button>
                            <button
                                onClick={() => setActiveTab('discover')}
                                className={`flex-1 py-1.5 text-sm font-bold rounded-full transition-colors ${activeTab === 'discover' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Discover
                            </button>
                        </div>
                        {/* Discover - Join via Code */}
                        {activeTab === 'discover' && (
                            <form onSubmit={handleJoinViaCode} className="p-4 bg-blue-50/50 border-b border-gray-100 flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest ml-1">Have an invite code?</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter 8-digit code"
                                        value={joinViaCode}
                                        onChange={(e) => setJoinViaCode(e.target.value.toUpperCase())}
                                        maxLength={8}
                                        className="flex-1 h-10 px-4 bg-white border border-gray-200 rounded-xl text-sm font-black tracking-widest outline-none focus:border-blue-400 transition-colors uppercase"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isJoiningCode || !joinViaCode.trim()}
                                        className="px-4 h-10 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                                    >
                                        {isJoiningCode ? "Joining..." : "Join"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col gap-1 p-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                                        <div className="w-14 h-14 bg-gray-100 rounded-2xl shrink-0"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-100 rounded-full w-3/4"></div>
                                            <div className="h-3 bg-gray-50 rounded-full w-1/2"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : displayedList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                                <HugeiconsIcon icon={LeftToRightListDashIcon} className="w-12 h-12 mb-4" />
                                <p className="font-bold">No circles found</p>
                            </div>
                        ) : displayedList.map((circle) => (
                            <div
                                key={circle.id}
                                onClick={() => openCircle(circle.id)}
                                className={`flex items-center gap-4 p-4 lg:px-6 cursor-pointer transition-colors border-l-4 
                                    ${activeCircleId === circle.id
                                        ? 'bg-gray-50 border-[#ffc107]'
                                        : 'bg-white border-transparent hover:bg-gray-50/50 border-b border-b-gray-50'
                                    }`}
                            >
                                {/* Avatar */}
                                <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-gray-200">
                                    <Avatar src={circle.avatar_url} name={circle.name} className="w-full h-full rounded-none" />
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <h3 className="font-bold text-gray-900 text-[15px] truncate pr-2">
                                            {circle.name}
                                        </h3>
                                        {activeTab === "my" && (
                                            <span className={`text-[11px] font-semibold shrink-0 ${activeCircleId === circle.id ? 'text-[#ffc107]' : 'text-gray-400'}`}>
                                                {circle.timestamp}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[9px] font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded-[4px]">{circle.course}</span>
                                        <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                                            <HugeiconsIcon icon={UserGroupIcon} className="w-3 h-3" />
                                            {circle.member_count || 0}
                                        </div>
                                    </div>
                                    <p className={`text-[13px] truncate ${circle.unread > 0 ? 'text-black font-semibold' : 'text-gray-500 font-medium'}`}>
                                        {activeTab === "my" ? (circle.last_message || "No messages yet") : circle.description}
                                    </p>
                                </div>

                                {/* Unread Indicator */}
                                {circle.unread > 0 && activeTab === "my" && (
                                    <div className="w-5 h-5 bg-[#ff3b30] text-white text-[10px] font-bold flex items-center justify-center rounded-full shrink-0">
                                        {circle.unread}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT PANEL: Active Circle Area */}
                <div className={`flex flex-col bg-[#fbf9f1] ${!isMobileListVisible ? 'fixed inset-0 z-[60] md:relative md:z-20 md:flex-1 md:h-full' : 'hidden md:flex md:flex-1 md:h-full'}`}>
                    {activeCircleData ? (
                        <>
                            {/* Circle Header */}
                            <div className="h-[76px] px-4 md:px-6 border-b border-gray-100 bg-white flex items-center justify-between shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)] z-10">
                                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                    {/* Mobile Back Button */}
                                    <button
                                        className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 -ml-2 shrink-0"
                                        onClick={() => window.history.back()}
                                    >
                                        <HugeiconsIcon icon={ArrowLeft01Icon} className="w-6 h-6 text-gray-900" />
                                    </button>

                                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-gray-200">
                                        <Avatar src={activeCircleData.avatar_url} name={activeCircleData.name} className="w-full h-full rounded-none" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            {profile?.id === activeCircleData.created_by ? (
                                                <Link href={`/dashboard/study-circles/${activeCircleData.id}/edit`} className="hover:underline flex items-center gap-1.5">
                                                    <span className="font-black text-gray-900 text-[16px] truncate">{activeCircleData.name}</span>
                                                </Link>
                                            ) : (
                                                <span className="font-black text-gray-900 text-[16px] truncate">{activeCircleData.name}</span>
                                            )}
                                            {activeCircleData.is_private && (
                                                <HugeiconsIcon icon={LockIcon} className="w-3 h-3 text-gray-400" variant="solid" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-semibold text-gray-500">{activeCircleData.member_count || 0} members</span>
                                            {activeCircleData.invite_code && (
                                                <div className="flex items-center gap-1 ml-1 text-blue-600 font-bold text-[10px] bg-blue-50 px-1.5 py-0.5 rounded cursor-pointer hover:bg-blue-100 transition-colors"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(activeCircleData.invite_code);
                                                        showToast("Invite code copied!", "success");
                                                    }}
                                                >
                                                    <HugeiconsIcon icon={Link01Icon} className="w-2.5 h-2.5" />
                                                    Code: {activeCircleData.invite_code}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 md:gap-2 shrink-0">
                                    <button className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center hover:bg-gray-100 transition-colors text-gray-500">
                                        <HugeiconsIcon icon={InformationCircleIcon} className="w-5 h-5" />
                                    </button>
                                    {activeTab === "my" && (
                                        <div className="relative" ref={menuRef}>
                                            <button
                                                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isMoreMenuOpen ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-100 text-gray-500'}`}
                                                title="More options"
                                            >
                                                <HugeiconsIcon icon={MoreVerticalIcon} className="w-5 h-5" />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {isMoreMenuOpen && (
                                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-[100] animate-in fade-in zoom-in duration-200 origin-top-right">
                                                    <button
                                                        onClick={() => {
                                                            setIsMoreMenuOpen(false);
                                                            handleLeaveCircle(activeCircleData.id);
                                                        }}
                                                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 text-red-600 transition-colors group"
                                                    >
                                                        <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <HugeiconsIcon icon={Logout01Icon} className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-sm font-black">Leave Circle</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => {
                                            if (!isMobileListVisible && window.innerWidth < 768) {
                                                window.history.back();
                                            } else {
                                                setActiveCircleId(null);
                                                setIsMobileListVisible(true);
                                            }
                                        }}
                                        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors text-gray-400 group hidden sm:flex"
                                    >
                                        <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>
                            </div>

                            {/* Pinned Message Banner */}
                            {(activeCircleData.pinned_message && activeTab === "my") && (
                                <div className="border-b border-gray-100 bg-blue-50/80 px-4 md:px-6 py-2.5 flex items-start gap-3 shrink-0 shadow-sm z-0">
                                    <HugeiconsIcon icon={PinIcon} className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Pinned Resource</span>
                                        <span className="font-bold text-gray-800 text-[13px] leading-tight max-w-[280px] lg:max-w-xl">
                                            {activeCircleData.pinned_message}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Messages Scroll Area */}
                            {activeTab === "my" ? (
                                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-20">
                                    {messages.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40">
                                            <HugeiconsIcon icon={SentIcon} className="w-12 h-12 mb-4" />
                                            <p className="font-bold">No messages yet. Start the conversation!</p>
                                        </div>
                                    ) : messages.map((msg, index) => {
                                        const isMe = msg.user_id === profile?.id;
                                        const showAvatar = !isMe && (index === 0 || messages[index - 1].user_id !== msg.user_id);

                                        return (
                                            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`flex max-w-[85%] md:max-w-[70%] gap-3`}>
                                                    {/* Other User Avatar */}
                                                    {!isMe ? (
                                                        <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden mt-1">
                                                            {showAvatar ? (
                                                                <Avatar src={msg.avatar} name={msg.sender} className="w-full h-full" />
                                                            ) : <div className="w-8 h-8"></div>}
                                                        </div>
                                                    ) : null}

                                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                        {showAvatar && !isMe && (
                                                            <span className="text-[11px] font-bold text-gray-500 ml-1 mb-1">{msg.sender}</span>
                                                        )}
                                                        <div className={`px-4 py-3 rounded-2xl shadow-sm ${isMe
                                                            ? 'bg-[#ffc107] text-black rounded-tr-sm'
                                                            : 'bg-white border border-gray-100 text-gray-900 rounded-tl-sm'
                                                            }`}>
                                                            <p className="text-[14px] font-medium leading-relaxed">
                                                                {msg.text}
                                                            </p>
                                                        </div>
                                                        <span className={`text-[10px] text-gray-400 font-medium mt-1 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                                                            {msg.timestamp}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} className="h-4 shrink-0" />
                                </div>
                            ) : (
                                /* Discover Mode - Join Group Banner */
                                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/50 text-center">
                                    <div className="w-32 h-32 rounded-[2rem] overflow-hidden shadow-lg border-4 border-white mb-6">
                                        <Avatar src={activeCircleData.avatar_url} name={activeCircleData.name} className="w-full h-full rounded-none" />
                                    </div>
                                    <h2 className="text-3xl font-black font-newyork text-gray-900 mb-2">{activeCircleData.name}</h2>
                                    <p className="text-gray-500 font-medium mb-6 max-w-sm">{activeCircleData.description}</p>
                                    <div className="flex items-center gap-4 text-gray-600 font-bold bg-white px-6 py-2 rounded-full border border-gray-200 shadow-sm mb-8">
                                        <div className="flex items-center gap-1"><HugeiconsIcon icon={UserGroupIcon} className="w-4 h-4" /> {activeCircleData.member_count || 0} Members</div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                        <div className="text-blue-600">{activeCircleData.course}</div>
                                    </div>
                                    <button
                                        onClick={() => handleJoinCircle(activeCircleData.id)}
                                        className="bg-black text-white hover:bg-gray-800 font-black px-10 py-4 rounded-full text-[16px] shadow-lg active:scale-95 transition-all"
                                    >
                                        Join Study Circle
                                    </button>
                                </div>
                            )}

                            {/* Message Input Box (Only show if in My Circles) */}
                            {activeTab === "my" && (
                                <div className="p-3 md:p-4 bg-white border-t border-gray-100 shrink-0 pb-4 md:pb-4 z-10">
                                    <form
                                        onSubmit={handleSendMessage}
                                        className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-[1.5rem] p-2 pl-4 focus-within:border-[#ffc107] focus-within:bg-white focus-within:shadow-sm transition-all"
                                    >
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Message the circle..."
                                            className="flex-1 bg-transparent border-none outline-none resize-none text-gray-800 placeholder:text-gray-400 font-medium text-[14px] max-h-32 min-h-[40px] py-2.5"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage(e);
                                                } else if (e.key === 'Escape') {
                                                    setActiveCircleId(null);
                                                }
                                            }}
                                        />

                                        <div className="flex items-center gap-1 pb-1">
                                            <button type="button" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                                                <HugeiconsIcon icon={Attachment01Icon} className="w-4 h-4" />
                                            </button>
                                            <button type="button" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                                                <HugeiconsIcon icon={Image01Icon} className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={!newMessage.trim()}
                                                className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ml-1"
                                            >
                                                <HugeiconsIcon icon={SentIcon} className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Empty State if no circle is selected */
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50">
                            <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                                <div className="absolute inset-0 border-[3px] border-[#ffc107]/20 rounded-full animate-[ping_3s_ease-in-out_infinite]"></div>
                                <div className="absolute inset-2 border-[2px] border-[#ffc107]/40 rounded-full animate-[ping_3s_ease-in-out_infinite_animation-delay-500ms]"></div>
                                <div className="relative z-10 w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
                                    <HugeiconsIcon icon={UserGroupIcon} className="w-10 h-10 text-[#ffc107]" variant="solid" tone="solid" strokeWidth={2} />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black font-newyork text-gray-900 mb-3 tracking-wide">Study Circles</h3>
                            <p className="text-gray-500 font-medium text-[15px] max-w-sm leading-relaxed mb-8">
                                Connect with coursemates, join academic discussions, and share resources easily. Choose a circle to start.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
