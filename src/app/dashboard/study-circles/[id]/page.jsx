"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ArrowLeft01Icon,
    SentIcon,
    Attachment01Icon,
    Cancel01Icon,
    InformationCircleIcon,
    LockIcon,
    MoreVerticalIcon,
    Logout01Icon,
    Download01Icon,
    ArrowMoveUpLeftIcon,
    Settings02Icon
} from "@hugeicons/core-free-icons";
import Avatar from "@/components/ui/Avatar";
import { useUI } from "@/components/ui/UIProvider";
import GroupInfoDrawer from "@/components/dashboard/GroupInfoDrawer";
import Linkify from "@/components/ui/Linkify";

const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
    }).format(new Date(date));
};

const downloadFile = async (url, fallbackName = 'attachment') => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;

        let filename = fallbackName;
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            const lastPart = pathParts[pathParts.length - 1];
            if (lastPart) filename = decodeURIComponent(lastPart);
        } catch (e) { }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('Download failed:', error);
        window.open(url, '_blank', 'noopener,noreferrer');
    }
};

export default function StudyCircleDetailPage() {
    const { id: circleId } = useParams();
    const { showToast, confirmAction, showImage } = useUI();
    const supabase = createClient();
    const router = useRouter();

    const [profile, setProfile] = useState(null);
    const [circleData, setCircleData] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);

    // Feature States
    const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);

    // Attachment State
    const [selectedAttachments, setSelectedAttachments] = useState([]);
    const [attachmentPreviews, setAttachmentPreviews] = useState([]);
    const [isSending, setIsSending] = useState(false);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const menuRef = useRef(null);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

    useEffect(() => {
        const fetchData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: profileData } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", session.user.id)
                    .single();
                setProfile(profileData || session.user);
                loadCircleData(session.user.id);
            } else {
                router.push('/auth/login');
            }
        };

        fetchData();

        // Handle Escape key
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                router.push('/dashboard/study-circles');
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [circleId, router, supabase]);

    const loadCircleData = async (userId) => {
        setLoading(true);
        // Fetch Circle Details
        const { data: circle, error: circleError } = await supabase
            .from("study_circles")
            .select("*")
            .eq("id", circleId)
            .single();

        if (circleError) {
            router.push('/dashboard/study-circles');
            return;
        }

        // Check Membership
        const { data: membership } = await supabase
            .from("study_circle_members")
            .select("*")
            .eq("circle_id", circleId)
            .eq("user_id", userId)
            .single();

        if (!membership) {
            router.push(`/dashboard/study-circles/${circleId}/join`);
            return;
        }

        // Fetch member count
        const { count } = await supabase
            .from("study_circle_members")
            .select("*", { count: 'exact', head: true })
            .eq("circle_id", circleId);

        setCircleData({ ...circle, member_count: count || 0 });
        await fetchMessages();
        setLoading(false);
    };

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from("study_circle_messages")
            .select(`
                *,
                author:users (display_name, profile_picture)
            `)
            .eq("circle_id", circleId)
            .order("created_at", { ascending: true });

        if (!error) {
            setMessages(data.map(m => ({
                id: m.id,
                sender: m.author?.display_name || "Unknown",
                text: m.content,
                attachment: m.attachment_url,
                timestamp: formatDate(m.created_at),
                created_at_raw: m.created_at,
                avatar: m.author?.profile_picture,
                user_id: m.user_id,
                reply_to_id: m.reply_to_id,
                reply_to: data.find(parent => parent.id === m.reply_to_id) ? {
                    sender: data.find(parent => parent.id === m.reply_to_id).author?.display_name || "Unknown",
                    text: data.find(parent => parent.id === m.reply_to_id).content
                } : null
            })));
            setTimeout(scrollToBottom, 100);
        }
    };

    // Realtime subscription & Presence
    const [typingUsers, setTypingUsers] = useState([]);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        if (!circleId || !profile) return;

        const channel = supabase.channel(`circle-${circleId}`, {
            config: {
                presence: {
                    key: profile.id,
                },
            },
        });

        channel
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'study_circle_messages',
                filter: `circle_id=eq.${circleId}`
            }, async (payload) => {
                const { data: authorData } = await supabase
                    .from("users")
                    .select("display_name, profile_picture")
                    .eq("id", payload.new.user_id)
                    .single();

                const newMsg = {
                    id: payload.new.id,
                    sender: authorData?.display_name || "Unknown",
                    text: payload.new.content,
                    attachment: payload.new.attachment_url,
                    timestamp: formatDate(payload.new.created_at),
                    created_at_raw: payload.new.created_at,
                    avatar: authorData?.profile_picture,
                    user_id: payload.new.user_id,
                    reply_to_id: payload.new.reply_to_id,
                    reply_to: null // We'll handle parent lookup if needed or just skip for real-time for now
                };

                // Simple parent lookup if it's a reply
                if (newMsg.reply_to_id) {
                    setMessages(prev => {
                        const parent = prev.find(m => m.id === newMsg.reply_to_id);
                        if (parent) {
                            newMsg.reply_to = {
                                sender: parent.sender,
                                text: parent.text
                            };
                        }

                        if (prev.some(m => m.id === newMsg.id || (m.text === newMsg.text && m.user_id === newMsg.user_id && m.id?.toString().startsWith('temp-')))) {
                            return prev.map(m => (m.text === newMsg.text && m.user_id === newMsg.user_id) ? newMsg : m);
                        }
                        return [...prev, newMsg];
                    });
                } else {
                    setMessages(prev => {
                        if (prev.some(m => m.id === newMsg.id || (m.text === newMsg.text && m.user_id === newMsg.user_id && m.id?.toString().startsWith('temp-')))) {
                            return prev.map(m => (m.text === newMsg.text && m.user_id === newMsg.user_id) ? newMsg : m);
                        }
                        return [...prev, newMsg];
                    });
                }

                setTimeout(scrollToBottom, 300);
            })
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const typing = [];
                for (const id in state) {
                    state[id].forEach(p => {
                        if (p.is_typing && id !== profile.id) {
                            typing.push(p.display_name || "Someone");
                        }
                    });
                }
                setTypingUsers(typing);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                // Handle join
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                // Handle leave
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        display_name: profile.display_name,
                        is_typing: false
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [circleId, profile, supabase]);

    const handleTyping = async () => {
        if (!circleId || !profile) return;

        const channel = supabase.channel(`circle-${circleId}`);
        await channel.track({
            display_name: profile.display_name,
            is_typing: true
        });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(async () => {
            await channel.track({
                display_name: profile.display_name,
                is_typing: false
            });
        }, 3000);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && selectedAttachments.length === 0) || !profile || !circleId) return;

        setIsSending(true);

        const tempMessage = {
            id: 'temp-' + Date.now(),
            sender: profile.display_name || profile.email,
            text: newMessage || "",
            attachment: attachmentPreviews.length > 0 ? attachmentPreviews.join(',') : null,
            timestamp: formatDate(new Date()),
            created_at_raw: new Date().toISOString(),
            avatar: profile.profile_picture,
            user_id: profile.id,
            reply_to: replyingTo ? {
                sender: replyingTo.sender,
                text: replyingTo.text
            } : null
        };

        setMessages(prev => [...prev, tempMessage]);

        const msgText = newMessage.trim();
        const msgAttachmentFiles = [...selectedAttachments];
        const replyToId = replyingTo?.id;

        setNewMessage("");
        setSelectedAttachments([]);
        setAttachmentPreviews([]);
        setReplyingTo(null);
        setTimeout(scrollToBottom, 100);

        let urls = [];

        if (msgAttachmentFiles.length > 0) {
            const uploadPromises = msgAttachmentFiles.map(async (file, index) => {
                const fileExt = file.name.split('.').pop();
                const fileName = `study-circle-attachments/${profile.id}-${Date.now()}-${index}.${fileExt}`;

                // 1. Get presigned URL from our API
                const response = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fileName: fileName,
                        fileType: file.type,
                    }),
                });

                if (!response.ok) throw new Error("Failed to get upload URL");
                const { uploadUrl, publicUrl: r2PublicUrl } = await response.json();

                // 2. Upload directly to Cloudflare R2
                const uploadResponse = await fetch(uploadUrl, {
                    method: "PUT",
                    headers: { "Content-Type": file.type },
                    body: file,
                });

                if (!uploadResponse.ok) throw new Error("Failed to upload");

                return r2PublicUrl;
            });

            try {
                urls = await Promise.all(uploadPromises);
            } catch (error) {
                console.error("Study Circle attachment upload error:", error);
                showToast("Failed to upload one or more attachments", "error");
                setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
                setIsSending(false);
                return;
            }
        }

        const url = urls.length > 0 ? urls.join(',') : null;

        const { error } = await supabase
            .from("study_circle_messages")
            .insert({
                circle_id: circleId,
                user_id: profile.id,
                content: msgText || "",
                attachment_url: url,
                reply_to_id: replyToId
            });

        setIsSending(false);
        if (error) {
            showToast("Failed to send message", "error");
            setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        }
    };

    const handleAttachmentSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const validFiles = files.filter(file => (file.size / (1024 * 1024)) <= 15);
            if (validFiles.length !== files.length) {
                showToast("Some files are larger than 15MB and were excluded.", "error");
            }
            if (validFiles.length > 0) {
                setSelectedAttachments(prev => [...prev, ...validFiles]);
                setAttachmentPreviews(prev => [...prev, ...validFiles.map(f => URL.createObjectURL(f))]);
            }
        }
        e.target.value = "";
    };

    const handleLeaveCircle = async () => {
        confirmAction({
            title: "Leave Study Circle",
            message: "Are you sure you want to leave?",
            confirmText: "Leave",
            cancelText: "Stay",
            action: async () => {
                const { error } = await supabase
                    .from("study_circle_members")
                    .delete()
                    .eq("circle_id", circleId)
                    .eq("user_id", profile.id);

                if (!error) {
                    showToast("Left Circle", "success");
                    router.push('/dashboard/study-circles');
                }
            }
        });
    };

    if (loading) return (
        <div className="flex-1 flex flex-col min-w-0 bg-[#fbf9f1]">
            <div className="h-[76px] px-4 md:px-6 border-b border-gray-100 bg-white flex items-center shrink-0 z-10">
                <div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse" />
                <div className="ml-4 space-y-2">
                    <div className="w-32 h-4 bg-gray-100 rounded animate-pulse" />
                    <div className="w-20 h-3 bg-gray-100 rounded animate-pulse" />
                </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        </div>
    );

    return (
        <div className="relative flex flex-col h-full overflow-hidden">
            {/* Circle Header */}
            <div className="h-[76px] px-4 md:px-6 border-b border-gray-100 bg-white flex items-center justify-between shrink-0 z-30">
                <div
                    className="flex items-center gap-3 md:gap-4 min-w-0 cursor-pointer hover:bg-gray-50/50 p-1 -ml-1 rounded-xl transition-colors"
                    onClick={() => setIsInfoDrawerOpen(true)}
                >
                    <Link href="/dashboard/study-circles" className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 -ml-2" onClick={(e) => e.stopPropagation()}>
                        <HugeiconsIcon icon={ArrowLeft01Icon} className="w-6 h-6 text-gray-900" />
                    </Link>
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-gray-200">
                        <Avatar src={circleData.avatar_url} name={circleData.name} className="w-full h-full rounded-none" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className="font-black text-gray-900 text-[16px] truncate">{circleData.name}</span>
                            {circleData.is_private && <HugeiconsIcon icon={LockIcon} className="w-3 h-3 text-gray-400" />}
                        </div>
                        {typingUsers.length > 0 ? (
                            <span className="text-[11px] font-bold text-green-600 animate-pulse truncate">
                                {typingUsers.length === 1
                                    ? `${typingUsers[0]} is typing...`
                                    : `${typingUsers.length} people are typing...`}
                            </span>
                        ) : (
                            <span className="text-[11px] font-semibold text-gray-500">{circleData.member_count} members</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-500">
                            <HugeiconsIcon icon={MoreVerticalIcon} className="w-5 h-5" />
                        </button>
                        {isMoreMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-[200] animate-in fade-in zoom-in duration-200 origin-top-right">
                                {profile?.id === circleData?.created_by && (
                                    <Link
                                        href={`/dashboard/study-circles/${circleId}/edit`}
                                        className="w-full px-4 py-2.5 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                    >
                                        <HugeiconsIcon icon={Settings02Icon} className="w-4 h-4" />
                                        Circle Settings
                                    </Link>
                                )}
                                <button onClick={handleLeaveCircle} className="w-full px-4 py-2.5 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3">
                                    <HugeiconsIcon icon={Logout01Icon} className="w-4 h-4" />
                                    Leave Circle
                                </button>
                            </div>
                        )}
                    </div>
                    <Link
                        href="/dashboard/study-circles"
                        className="hidden md:flex w-10 h-10 rounded-full items-center justify-center hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
                        title="Close Chat"
                    >
                        <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
                    </Link>
                </div>
            </div>

            {/* Chat Messages */}
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-30 mt-10">
                        <HugeiconsIcon icon={InformationCircleIcon} className="w-12 h-12 mb-2" />
                        <p className="font-bold">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    (() => {
                        const grouped = messages.reduce((acc, msg) => {
                            const dateStr = new Date(msg.created_at_raw || new Date()).toDateString();
                            if (!acc[dateStr]) acc[dateStr] = [];
                            acc[dateStr].push(msg);
                            return acc;
                        }, {});

                        return Object.entries(grouped).map(([dateStr, dayMessages]) => {
                            const date = new Date(dateStr);
                            const today = new Date();
                            const yesterday = new Date();
                            yesterday.setDate(today.getDate() - 1);

                            let dateLabel = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

                            const isSameDay = (d1, d2) =>
                                d1.getFullYear() === d2.getFullYear() &&
                                d1.getMonth() === d2.getMonth() &&
                                d1.getDate() === d2.getDate();

                            if (isSameDay(date, today)) dateLabel = "Today";
                            else if (isSameDay(date, yesterday)) dateLabel = "Yesterday";

                            return (
                                <div key={dateStr} className="w-full">
                                    <div className="sticky top-0 z-20 flex justify-center py-4 pointer-events-none">
                                        <span className="bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest shadow-md border border-gray-100 pointer-events-auto">
                                            {dateLabel}
                                        </span>
                                    </div>
                                    <div className="px-4 md:px-6 space-y-4 pb-8">
                                        {dayMessages.map((msg, idx) => (
                                            <div key={msg.id || idx} className={`flex ${msg.user_id === profile?.id ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`flex gap-3 max-w-[85%] ${msg.user_id === profile?.id ? 'flex-row-reverse' : ''}`}>
                                                    {msg.user_id !== profile?.id && (
                                                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-1">
                                                            <Avatar src={msg.avatar} name={msg.sender} className="w-full h-full" />
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col">
                                                        <div className={`flex items-center gap-2 mb-1 ${msg.user_id === profile?.id ? 'justify-end' : ''}`}>
                                                            {msg.user_id !== profile?.id && (
                                                                <span className="text-[11px] font-bold text-gray-500">{msg.sender}</span>
                                                            )}
                                                            <span className="text-[10px] text-gray-400">{msg.timestamp}</span>
                                                        </div>
                                                        <motion.div
                                                            drag="x"
                                                            dragConstraints={{ left: 0, right: 80 }}
                                                            dragElastic={0.2}
                                                            dragSnapToOrigin={true}
                                                            onDragEnd={(e, info) => {
                                                                if (info.offset.x > 50) {
                                                                    setReplyingTo(msg);
                                                                }
                                                            }}
                                                            className={`p-4 rounded-2xl text-[14px] shadow-sm relative group/msg cursor-grab active:cursor-grabbing ${msg.user_id === profile?.id ? 'bg-[#ffc107] text-black rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}
                                                            whileTap={{ scale: 0.99 }}
                                                        >
                                                            {/* Swipe Indicator (Visible when dragging) */}
                                                            <div className="absolute inset-y-0 -left-10 flex items-center justify-center opacity-0 group-active/msg:opacity-100 transition-opacity">
                                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shadow-sm">
                                                                    <HugeiconsIcon icon={ArrowMoveUpLeftIcon} className="w-4 h-4 text-gray-400" />
                                                                </div>
                                                            </div>

                                                            {/* Quote Rendering */}
                                                            {msg.reply_to && (
                                                                <div className={`mb-2 p-2 rounded-lg border-l-4 text-[12px] bg-black/5 border-black/20 text-gray-600 line-clamp-2`}>
                                                                    <span className="font-black text-[10px] block uppercase tracking-wider mb-0.5">{msg.reply_to.sender}</span>
                                                                    {msg.reply_to.text}
                                                                </div>
                                                            )}

                                                            {msg.attachment && (() => {
                                                                const urls = msg.attachment.split(',');
                                                                const images = urls.filter(url => url.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) || url.startsWith('blob:') || url.match(/\.(jpeg|jpg|gif|png|webp)$/i));
                                                                const docs = urls.filter(url => !(url.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) || url.startsWith('blob:') || url.match(/\.(jpeg|jpg|gif|png|webp)$/i)));
                                                                return (
                                                                    <div className="mb-2 max-w-[300px] md:max-w-sm rounded-xl flex flex-col gap-1">
                                                                        {images.length > 0 && (
                                                                            <div className={`grid gap-1 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} rounded-xl overflow-hidden`}>
                                                                                {images.map((url, i) => (
                                                                                    <div key={i} className={`overflow-hidden border border-black/5 ${images.length === 3 && i === 0 ? 'col-span-2 aspect-[2/1]' : images.length === 1 ? 'aspect-auto' : 'aspect-square'} rounded-lg`}>
                                                                                        <img
                                                                                            src={url}
                                                                                            alt="Attachment"
                                                                                            className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                                                            onClick={() => showImage(url, "Attachment")}
                                                                                        />
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                        {docs.length > 0 && docs.map((url, i) => (
                                                                            <div
                                                                                key={i}
                                                                                onClick={() => downloadFile(url, `attachment-${msg.id}-${i}`)}
                                                                                className={`flex items-center justify-between gap-3 p-3 rounded-xl border border-black/5 cursor-pointer hover:opacity-90 transition-opacity mt-1 bg-black/5`}
                                                                            >
                                                                                <div className="flex items-center gap-3 overflow-hidden">
                                                                                    <div className="w-10 h-10 bg-white/50 shrink-0 rounded-full flex items-center justify-center">
                                                                                        <HugeiconsIcon icon={Download01Icon} className="w-5 h-5 opacity-70" />
                                                                                    </div>
                                                                                    <div className="flex flex-col overflow-hidden">
                                                                                        <span className="text-xs font-bold truncate max-w-[150px]">
                                                                                            {(() => {
                                                                                                try {
                                                                                                    const urlObj = new URL(url);
                                                                                                    const pathParts = urlObj.pathname.split('/');
                                                                                                    const lastPart = pathParts[pathParts.length - 1];
                                                                                                    const cleanName = decodeURIComponent(lastPart).replace(/^[^-]+-\d+\./, '');
                                                                                                    return cleanName || 'Document';
                                                                                                } catch (e) {
                                                                                                    return 'Document';
                                                                                                }
                                                                                            })()}
                                                                                        </span>
                                                                                        <span className="text-[10px] opacity-60 uppercase">{url.split('.').pop()?.split('?')[0] || 'FILE'}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            })()}
                                                            <Linkify 
                                                                text={msg.text} 
                                                                className={`whitespace-pre-wrap ${msg.user_id === profile?.id ? 'text-black [&_a]:text-black [&_a]:underline' : ''}`} 
                                                            />
                                                        </motion.div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        });
                    })()
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 bg-white border-t border-gray-100">
                {/* Reply Preview */}
                {replyingTo && (
                    <div className="mb-3 flex gap-3 animate-in slide-in-from-bottom-2 duration-200">
                        <div className="flex-1 bg-gray-50 p-3 rounded-2xl border-l-4 border-black text-sm relative">
                            <span className="font-black text-[11px] block text-black uppercase tracking-widest mb-1">
                                Replying to {replyingTo.sender}
                            </span>
                            <p className="text-gray-500 line-clamp-1">{replyingTo.text}</p>
                            <button
                                onClick={() => setReplyingTo(null)}
                                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-200 text-gray-400"
                            >
                                <HugeiconsIcon icon={Cancel01Icon} className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {attachmentPreviews && attachmentPreviews.length > 0 && (
                    <div className="mb-3 px-2 flex flex-wrap gap-2">
                        {attachmentPreviews.map((preview, idx) => (
                            <div key={idx} className="relative inline-block border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm p-1 pr-8">
                                {selectedAttachments[idx]?.type.startsWith('image/') ? (
                                    <img src={preview} alt="Preview" className="h-16 w-auto rounded-lg object-cover" />
                                ) : (
                                    <div className="flex items-center gap-3 px-3 py-2">
                                        <HugeiconsIcon icon={Attachment01Icon} className="w-5 h-5 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700 max-w-[150px] truncate">{selectedAttachments[idx]?.name}</span>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newFiles = [...selectedAttachments];
                                        newFiles.splice(idx, 1);
                                        setSelectedAttachments(newFiles);
                                        const newPreviews = [...attachmentPreviews];
                                        newPreviews.splice(idx, 1);
                                        setAttachmentPreviews(newPreviews);
                                    }}
                                    className="absolute top-1 right-1 w-6 h-6 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full flex items-center justify-center transition-colors"
                                >
                                    <HugeiconsIcon icon={Cancel01Icon} className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-[2rem] p-1.5 pl-4">
                    <textarea
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                        }}
                        placeholder="Write a message..."
                        className="flex-1 bg-transparent border-none outline-none py-3 text-sm resize-none max-h-32"
                        rows={1}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                    />
                    <div className="flex gap-1 pb-1">
                        <input type="file" multiple ref={fileInputRef} onChange={handleAttachmentSelect} className="hidden" />
                        <button type="button" onClick={() => fileInputRef.current.click()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500">
                            <HugeiconsIcon icon={Attachment01Icon} className="w-5 h-5" />
                        </button>
                        <button type="submit" disabled={isSending || (!newMessage.trim() && selectedAttachments.length === 0)} className="w-11 h-11 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 disabled:opacity-30">
                            <HugeiconsIcon icon={SentIcon} className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>

            <GroupInfoDrawer
                isOpen={isInfoDrawerOpen}
                onClose={() => setIsInfoDrawerOpen(false)}
                circle={circleData}
                profile={profile}
                onLeave={handleLeaveCircle}
            />
        </div>
    );
}
