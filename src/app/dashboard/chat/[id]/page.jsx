"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ArrowLeft01Icon,
    Message01Icon,
    InformationCircleIcon,
    Tick02Icon,
    TickDouble02Icon,
    SentIcon,
    Delete01Icon,
    Attachment01Icon,
    Image01Icon,
    Cancel01Icon,
    Download01Icon,
    ArrowMoveUpLeftIcon,
} from "@hugeicons/core-free-icons";
import ChatSidebar from "@/components/dashboard/ChatSidebar";
import { MessageSkeleton } from "@/components/ui/Skeleton";
import { useUI } from "@/components/ui/UIProvider";
import { useChatConfig } from "@/components/providers/ChatProvider";
import Avatar from "@/components/ui/Avatar";
import { getDisplayName } from "@/utils/stringUtils";
import Linkify from "@/components/ui/Linkify";
import UserBadge from "@/components/ui/UserBadge";
import { compressForChat } from "@/utils/compressImage";

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

export default function ChatWindowPage() {
    const { id } = useParams();
    const router = useRouter();
    const [messages, setMessages] = useState([]);
    const [conversation, setConversation] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);
    const supabase = createClient();
    const { confirmAction, showToast, openReportModal, showImage } = useUI();
    const { setActiveConversation, refreshUnreadCount } = useChatConfig();

    const [selectedAttachments, setSelectedAttachments] = useState([]);
    const [attachmentPreviews, setAttachmentPreviews] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);

    // Register this chat as the active conversation so the global provider
    // skips incrementing unread counts for messages arriving here
    useEffect(() => {
        setActiveConversation(id);
        return () => {
            setActiveConversation(null);
            // Refresh to get the true DB count after leaving
            refreshUnreadCount();
        };
    }, [id, setActiveConversation, refreshUnreadCount]);

    useEffect(() => {
        let channel = null;
        let cancelled = false;

        const setupChat = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || cancelled) return;
            setCurrentUser(session.user);

            // 1. Fetch conversation details (who am I talking to?)
            const { data: convData, error: convError } = await supabase
                .from('conversations')
                .select(`
                    *,
                    participants:conversation_participants(
                        user:users(id, display_name, first_name, profile_picture, username, is_verified, is_admin)
                    ),
                    gig:gigs(
                        id, title, price, category,
                        author:users(display_name, first_name, profile_picture)
                    )
                `)
                .eq('id', id)
                .single();

            if (convError || cancelled) {
                if (convError) console.error("Error fetching conversation:", convError);
                return;
            }

            const otherUserRaw = convData.participants.find(p => p.user.id !== session.user.id)?.user;
            setConversation({
                ...convData,
                otherUser: otherUserRaw ? { ...otherUserRaw, computedName: getDisplayName(otherUserRaw) } : { computedName: "Somebody", display_name: "Somebody" }
            });

            // 2. Fetch messages
            const { data: msgData, error: msgError } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', id)
                .order('created_at', { ascending: true });

            if (!msgError && !cancelled) {
                const formattedMessages = (msgData || []).map(m => ({
                    ...m,
                    reply_to: msgData.find(parent => parent.id === m.reply_to_id) ? {
                        sender: msgData.find(parent => parent.id === m.reply_to_id).sender_id === session.user.id ? 'You' : convData.participants.find(p => p.user.id !== session.user.id)?.user.display_name || 'Somebody',
                        text: msgData.find(parent => parent.id === m.reply_to_id).content
                    } : null
                }));
                setMessages(formattedMessages);

                // Mark incoming messages as read
                if (msgData?.length > 0) {
                    supabase.rpc('mark_messages_as_read', {
                        p_conversation_id: id,
                        p_user_id: session.user.id
                    }).then(({ error }) => {
                        if (error) console.error("Error marking messages as read:", error);
                    });
                }
            }
            setLoading(false);

            if (cancelled) return;

            // 3. Subscribe to real-time updates
            channel = supabase
                .channel(`chat:${id}:${Date.now()}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
                    (payload) => {
                        setMessages(prev => {
                            if (prev.find(m => m.id === payload.new.id)) return prev;

                            // Helper to format the incoming message with reply data
                            const formatMsg = (raw) => {
                                const parent = prev.find(m => m.id === raw.reply_to_id);
                                return {
                                    ...raw,
                                    reply_to: parent ? {
                                        sender: parent.sender_id === session.user.id ? 'You' : convData.participants.find(p => p.user.id !== session.user.id)?.user.display_name || 'Somebody',
                                        text: parent.content
                                    } : null
                                };
                            };

                            const formattedNew = formatMsg(payload.new);

                            const optimisticMatch = prev.find(m =>
                                m.id.toString().startsWith('temp-') &&
                                m.sender_id === payload.new.sender_id &&
                                (m.content === payload.new.content || (!m.content && !payload.new.content && m.attachment_url))
                            );

                            if (optimisticMatch) {
                                return prev.map(m => m.id === optimisticMatch.id ? formattedNew : m);
                            }

                            return [...prev, formattedNew];
                        });

                        // If the incoming message is not from us, mark it as read immediately
                        if (payload.new.sender_id !== session.user.id) {
                            supabase.rpc('mark_messages_as_read', {
                                p_conversation_id: id,
                                p_user_id: session.user.id
                            });
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
                    (payload) => {
                        setMessages(prev => prev.map(msg => {
                            if (msg.id !== payload.new.id) return msg;

                            // Keep existing reply_to if it exists, as UPDATE payload won't have it
                            return {
                                ...payload.new,
                                reply_to: msg.reply_to
                            };
                        }));
                    }
                )
                .subscribe((status) => {
                    if (status === 'CHANNEL_ERROR') {
                        console.error('Chat channel error, retrying...');
                        // Auto-retry by re-subscribing
                        setTimeout(() => {
                            if (!cancelled && channel) {
                                channel.subscribe();
                            }
                        }, 2000);
                    }
                });
        };

        setupChat();

        return () => {
            cancelled = true;
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Force a re-render every minute to update the "is deletable" 30-min window constraint
    const [, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(interval);
    }, []);

    // Close chat on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') router.push('/dashboard/chat');
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

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
        // clear input so same files can be selected again if needed
        e.target.value = "";
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && selectedAttachments.length === 0) || !currentUser) return;

        setIsSending(true);

        const content = newMessage.trim();

        // OPTIMISTIC UI: Instantly add the message to the view
        const tempId = `temp-${Date.now()}`;
        const optimisticMsg = {
            id: tempId,
            conversation_id: id,
            sender_id: currentUser.id,
            content: content || "",
            attachment_url: attachmentPreviews.length > 0 ? attachmentPreviews.join(',') : null,
            created_at: new Date().toISOString(),
            is_read: false,
            reply_to_id: replyingTo?.id,
            reply_to: replyingTo ? {
                sender: replyingTo.sender_id === currentUser.id ? 'You' : conversation.otherUser.display_name,
                text: replyingTo.content
            } : null
        };

        setMessages(prev => [...prev, optimisticMsg]);

        const msgAttachmentFiles = [...selectedAttachments];
        const replyToId = replyingTo?.id;

        setNewMessage("");
        setReplyingTo(null);
        setSelectedAttachments([]);
        setAttachmentPreviews([]);

        let urls = [];

        if (msgAttachmentFiles.length > 0) {
            const uploadPromises = msgAttachmentFiles.map(async (file, index) => {
                // Compress images before upload (PDFs, docs, etc. pass through)
                const fileToUpload = await compressForChat(file);
                const fileExt = fileToUpload.name.split('.').pop();
                const fileName = `chat-attachments/${currentUser.id}-${Date.now()}-${index}.${fileExt}`;

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
                    headers: { "Content-Type": fileToUpload.type },
                    body: fileToUpload,
                });

                if (!uploadResponse.ok) throw new Error("Failed to upload");

                return r2PublicUrl;
            });

            try {
                urls = await Promise.all(uploadPromises);
            } catch (error) {
                console.error("Error uploading attachments:", error);
                showToast("Failed to upload one or more attachments", "error");
                setMessages(prev => prev.filter(m => m.id !== tempId));
                setIsSending(false);
                return;
            }
        }

        const url = urls.length > 0 ? urls.join(',') : null;

        const { error } = await supabase
            .from('messages')
            .insert({
                conversation_id: id,
                sender_id: currentUser.id,
                content: content || "",
                attachment_url: url,
                reply_to_id: replyToId
            });

        setIsSending(false);
        if (error) {
            console.error("Error sending message:", error);
            // Revert optimistic update on failure
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } else {
            // Update conversation updated_at, last_message, and clear hidden_by so it resurrects for the other user
            await supabase
                .from('conversations')
                .update({
                    last_message: content || (url ? 'Sent an attachment' : ''),
                    updated_at: new Date().toISOString(),
                    hidden_by: []
                })
                .eq('id', id);

            // Trigger Push Notification
            if (conversation?.otherUser?.id) {
                fetch('/api/notifications/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userIds: [conversation.otherUser.id],
                        title: currentUser.display_name || "New Message",
                        message: content || (url ? "Sent an attachment" : "Sent a message"),
                        url: `${window.location.origin}/dashboard/chat/${id}`
                    })
                }).catch(err => console.error("Notification trigger failed:", err));
            }
        }
    };


    const handleDeleteMessage = async (msgId) => {
        confirmAction({
            title: "Delete message",
            message: "Are you sure you want to delete this message? This cannot be undone.",
            confirmText: "Delete",
            cancelText: "Cancel",
            onConfirm: async () => {
                // Optimistically remove
                const previousMessages = [...messages];
                setMessages(prev => prev.filter(m => m.id !== msgId));

                const { error } = await supabase
                    .from('messages')
                    .delete()
                    .eq('id', msgId)
                    .eq('sender_id', currentUser.id);

                if (error) {
                    console.error("Error deleting message:", error);
                    showToast("Failed to delete message.", "error");
                    setMessages(previousMessages); // Revert
                } else {
                    // Update latest message in conversation so the sidebar list stays accurate
                    const { data: latestMsg } = await supabase
                        .from('messages')
                        .select('content')
                        .eq('conversation_id', id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    await supabase
                        .from('conversations')
                        .update({
                            last_message: latestMsg ? latestMsg.content : "Message deleted",
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', id);
                }
            }
        });
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-64px)] md:h-[calc(100vh-32px)] bg-white md:bg-[#fcf6de] md:p-4 lg:p-8 md:pt-0 max-w-[1200px] mx-auto w-full overflow-hidden">
                <div className="flex w-full h-full bg-white md:rounded-[2.5rem] md:border md:border-gray-200 md:shadow-sm overflow-hidden">
                    {/* Sidebar skeleton on desktop */}
                    <div className="hidden md:flex md:w-[350px] lg:w-[400px] flex-col border-r border-gray-100 p-4 gap-2">
                        <div className="h-8 w-32 bg-gray-200 animate-pulse rounded-full mb-4" />
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-2">
                                <div className="size-14 rounded-full bg-gray-200 animate-pulse shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-28 bg-gray-200 animate-pulse rounded-full" />
                                    <div className="h-3 w-40 bg-gray-200 animate-pulse rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Chat area skeleton */}
                    <div className="flex-1 flex flex-col">
                        {/* Header skeleton */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
                            <div className="size-10 rounded-full bg-gray-200 animate-pulse" />
                            <div className="space-y-1.5">
                                <div className="h-4 w-32 bg-gray-200 animate-pulse rounded-full" />
                                <div className="h-3 w-16 bg-gray-200 animate-pulse rounded-full" />
                            </div>
                        </div>
                        {/* Messages skeleton */}
                        <div className="flex-1 p-6 flex flex-col gap-4">
                            <MessageSkeleton isMe={false} />
                            <MessageSkeleton isMe={true} />
                            <MessageSkeleton isMe={false} />
                            <MessageSkeleton isMe={true} />
                            <MessageSkeleton isMe={false} />
                        </div>
                        {/* Input skeleton */}
                        <div className="p-6 pt-0">
                            <div className="h-14 w-full bg-gray-100 animate-pulse rounded-[2rem]" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-64px)] md:h-[calc(100vh-32px)] bg-white md:bg-[#fcf6de] md:p-4 lg:p-8 md:pt-0 max-w-[1200px] mx-auto w-full overflow-hidden">
            <div className="flex w-full h-full bg-white md:rounded-[2.5rem] md:border md:border-gray-200 md:shadow-sm overflow-hidden">

                {/* Desktop Sidebar */}
                <div className="hidden md:flex">
                    <ChatSidebar activeId={id} />
                </div>

                <div className="flex-1 flex flex-col h-full overflow-hidden shrink-0 min-w-0">
                    {/* Chat Header */}
                    <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-4 min-w-0">
                            <button onClick={() => router.push('/dashboard/chat')} className="md:hidden p-2 hover:bg-gray-50 rounded-full transition-colors mr-1">
                                <HugeiconsIcon icon={ArrowLeft01Icon} size={20} className="text-gray-900" />
                            </button>
                            <div className="shrink-0">
                                <Avatar
                                    src={conversation?.otherUser.profile_picture}
                                    name={conversation?.otherUser.computedName || '?'}
                                    className="size-10 rounded-full border-2 border-[#ffc107]/20 shadow-sm"
                                />
                            </div>
                            <div className="min-w-0 flex flex-col justify-center">
                                <div className="flex items-center gap-1.5">
                                    <h2 className="text-[15px] font-black text-gray-900 leading-tight truncate">{conversation?.otherUser.computedName}</h2>
                                    <UserBadge 
                                        isAdmin={conversation?.otherUser.is_admin} 
                                        isVerified={conversation?.otherUser.is_verified} 
                                        size="sm"
                                    />
                                </div>
                                {conversation?.otherUser.username && (
                                    <span className="text-[12px] font-medium text-gray-500 truncate">@{conversation.otherUser.username}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => openReportModal({ item_id: id, item_type: 'conversation' })}
                                className="p-2.5 hover:bg-red-50 rounded-full transition-colors group"
                                title="Report user"
                            >
                                <HugeiconsIcon icon={InformationCircleIcon} size={20} className="text-gray-400 group-hover:text-red-400 transition-colors" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Stream */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-6 pb-32 md:pb-6 scroll-smooth flex flex-col gap-4 bg-gray-50/20"
                    >
                        {/* Gig Reference Card */}
                        {conversation?.gig && (
                            <div
                                onClick={() => router.push(`/dashboard/gigs/detail?id=${conversation.gig.id}`)}
                                className="cursor-pointer mx-auto w-full max-w-sm bg-white border-2 border-[#ffc107]/30 rounded-[1.5rem] p-4 flex gap-3 items-center shadow-sm hover:border-[#ffc107] hover:shadow-md transition-all mb-2"
                            >
                                <div className="shrink-0">
                                    <Avatar
                                        src={conversation.gig.author?.profile_picture}
                                        name={getDisplayName(conversation.gig.author, '?')}
                                        className="w-12 h-12 rounded-full border border-gray-100"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Gig Reference</p>
                                    <p className="text-[14px] font-black text-gray-900 truncate">{conversation.gig.title}</p>
                                    <p className="text-[13px] font-bold text-[#ffc107]">
                                        <span className="text-gray-400 text-[11px] font-medium mr-0.5">¢</span>
                                        {conversation.gig.price}
                                    </p>
                                </div>
                                <HugeiconsIcon icon={InformationCircleIcon} size={18} className="text-gray-300 shrink-0" />
                            </div>
                        )}

                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center opacity-30 mt-10">
                                <HugeiconsIcon icon={InformationCircleIcon} className="w-12 h-12 mb-2" />
                                <p className="font-bold">No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            (() => {
                                const grouped = messages.reduce((acc, msg) => {
                                    const dateStr = new Date(msg.created_at || new Date()).toDateString();
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
                                        <div key={dateStr} className="w-full flex flex-col gap-4">
                                            <div className="sticky top-0 z-20 flex justify-center py-4 pointer-events-none">
                                                <span className="bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest shadow-md border border-gray-100 pointer-events-auto">
                                                    {dateLabel}
                                                </span>
                                            </div>
                                            {dayMessages.map((msg, idx) => {
                                                const isMe = msg.sender_id === currentUser?.id;
                                                const isTemp = msg.id.toString().startsWith('temp-');

                                                // Check if message is less than 30 mins old
                                                const msgAgeMs = new Date() - new Date(msg.created_at);
                                                const canDelete = isMe && !isTemp && (msgAgeMs < 30 * 60 * 1000);

                                                return (
                                                    <div
                                                        key={msg.id || idx}
                                                        className={`flex group ${isMe ? 'justify-end' : 'justify-start'}`}
                                                    >
                                                        <div className="flex items-center gap-2 max-w-[85%] sm:max-w-[70%]">
                                                            {canDelete && (
                                                                <button
                                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-100 md:opacity-0 group-hover:opacity-100 shrink-0"
                                                                    title="Delete message"
                                                                >
                                                                    <HugeiconsIcon icon={Delete01Icon} size={16} />
                                                                </button>
                                                            )}

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
                                                                className={`px-5 py-3 rounded-[1.5rem] shadow-sm text-sm font-medium overflow-hidden flex flex-col gap-2 relative group/msg cursor-grab active:cursor-grabbing ${isMe
                                                                    ? 'bg-[#ffc107] text-black rounded-tr-none'
                                                                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                                                    }`}
                                                                whileTap={{ scale: 0.98 }}
                                                            >
                                                                {/* Swipe Indicator */}
                                                                <div className="absolute inset-y-0 -left-10 flex items-center justify-center opacity-0 group-active/msg:opacity-100 transition-opacity">
                                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shadow-sm">
                                                                        <HugeiconsIcon icon={ArrowMoveUpLeftIcon} className="w-4 h-4 text-gray-400" />
                                                                    </div>
                                                                </div>

                                                                {/* Render Quoted Message */}
                                                                {msg.reply_to && (
                                                                    <div className={`mb-1 p-2 rounded-lg border-l-4 text-[12px] bg-black/5 border-black/20 text-gray-600 line-clamp-2`}>
                                                                        <span className="font-black text-[10px] block uppercase tracking-wider mb-0.5">
                                                                            {msg.reply_to.sender}
                                                                        </span>
                                                                        {msg.reply_to.text}
                                                                    </div>
                                                                )}

                                                                {/* Render Attachment if exists */}
                                                                {msg.attachment_url && (() => {
                                                                    const urls = msg.attachment_url.split(',');
                                                                    const images = urls.filter(url => url.match(/\\.(jpeg|jpg|gif|png|webp)(\\?.*)?$/i) || url.startsWith('blob:') || url.match(/\\.(jpeg|jpg|gif|png|webp)$/i));
                                                                    const docs = urls.filter(url => !(url.match(/\\.(jpeg|jpg|gif|png|webp)(\\?.*)?$/i) || url.startsWith('blob:') || url.match(/\\.(jpeg|jpg|gif|png|webp)$/i)));
                                                                    return (
                                                                        <div className="max-w-[280px] md:max-w-sm rounded-xl flex flex-col gap-1">
                                                                            {images.length > 0 && (
                                                                                <div className={`grid gap-1 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} rounded-xl overflow-hidden`}>
                                                                                    {images.map((url, i) => (
                                                                                        <div key={i} className={`overflow-hidden ${images.length === 3 && i === 0 ? 'col-span-2 aspect-[2/1]' : images.length === 1 ? 'aspect-auto' : 'aspect-square'}`}>
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
                                                                                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer hover:opacity-90 transition-opacity mt-1 ${isMe ? 'bg-black/5 border-black/10 text-black' : 'bg-gray-50 border-gray-100 text-gray-800'}`}
                                                                                >
                                                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                                                        <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${isMe ? 'bg-white/40' : 'bg-white shadow-sm'}`}>
                                                                                            <HugeiconsIcon icon={Attachment01Icon} className="w-5 h-5 opacity-70" />
                                                                                        </div>
                                                                                        <div className="flex flex-col overflow-hidden">
                                                                                            <span className="text-sm font-bold truncate max-w-[150px]">
                                                                                                {(() => {
                                                                                                    try {
                                                                                                        const urlObj = new URL(url);
                                                                                                        const pathParts = urlObj.pathname.split('/');
                                                                                                        const lastPart = pathParts[pathParts.length - 1];
                                                                                                        const cleanName = decodeURIComponent(lastPart).replace(/^[^-]+-\\d+\\./, '');
                                                                                                        return cleanName || 'Document';
                                                                                                    } catch (e) {
                                                                                                        return 'Document';
                                                                                                    }
                                                                                                })()}
                                                                                            </span>
                                                                                            <span className="text-[10px] opacity-60 uppercase">{url.split('.').pop()?.split('?')[0] || 'FILE'}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center border ${isMe ? 'border-black/10 text-black' : 'border-gray-200 text-gray-500'}`}>
                                                                                        <HugeiconsIcon icon={Download01Icon} className="w-4 h-4" />
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    );
                                                                })()}

                                                                {msg.content && (
                                                                    <Linkify 
                                                                        text={msg.content} 
                                                                        className={`whitespace-pre-wrap ${isMe ? 'text-black [&_a]:text-black [&_a]:underline' : ''}`} 
                                                                    />
                                                                )}
                                                                <div className={`text-[10px] mt-1 opacity-50 flex items-center justify-end ${isMe ? 'text-black' : 'text-gray-500'}`}>
                                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    {isMe && (
                                                                        <HugeiconsIcon
                                                                            icon={msg.is_read ? TickDouble02Icon : Tick02Icon}
                                                                            size={12}
                                                                            className={`ml-1 ${msg.is_read ? 'text-blue-600' : 'text-gray-600'}`}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                });
                            })()
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="fixed md:relative bottom-[64px] md:bottom-auto left-0 right-0 md:left-auto md:right-auto p-4 md:p-6 md:pt-0 shrink-0 bg-white/90 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none border-t border-gray-100 md:border-none z-10">
                        {/* Reply Preview */}
                        <AnimatePresence>
                            {replyingTo && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="mb-3 flex gap-3"
                                >
                                    <div className="flex-1 bg-gray-50 p-3 rounded-2xl border-l-4 border-[#ffc107] text-sm relative">
                                        <span className="font-black text-[11px] block text-[#ffc107] uppercase tracking-widest mb-1">
                                            Replying to {replyingTo.sender_id === currentUser?.id ? 'You' : conversation?.otherUser.computedName}
                                        </span>
                                        <p className="text-gray-500 line-clamp-1">{replyingTo.content}</p>
                                        <button
                                            onClick={() => setReplyingTo(null)}
                                            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-200 text-gray-400"
                                        >
                                            <HugeiconsIcon icon={Cancel01Icon} className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Attachment Preview Container */}
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
                        <form
                            onSubmit={handleSendMessage}
                            className="relative flex items-end bg-gray-50 rounded-[2rem] border border-gray-100 p-1.5 pl-3 focus-within:border-[#ffc107]/50 focus-within:ring-4 focus-within:ring-[#ffc107]/5 transition-all shadow-sm"
                        >
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Message..."
                                className="flex-1 bg-transparent border-none outline-none px-3 py-3.5 text-[14px] font-medium placeholder:text-gray-400 resize-none max-h-32"
                                rows={1}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e);
                                    }
                                }}
                            />

                            <div className="flex items-center gap-1 pb-1">
                                <input
                                    type="file"
                                    multiple
                                    ref={fileInputRef}
                                    onChange={handleAttachmentSelect}
                                    className="hidden"
                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current.click()}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
                                >
                                    <HugeiconsIcon icon={Attachment01Icon} className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        fileInputRef.current.accept = "image/*";
                                        fileInputRef.current.click();
                                        setTimeout(() => {
                                            if (fileInputRef.current) fileInputRef.current.accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip";
                                        }, 1000);
                                    }}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
                                >
                                    <HugeiconsIcon icon={Image01Icon} className="w-5 h-5" />
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSending || (!newMessage.trim() && selectedAttachments.length === 0)}
                                    className="size-11 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none shrink-0"
                                >
                                    <HugeiconsIcon icon={SentIcon} size={20} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </div>

    );
}
