"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ArrowLeft01Icon,
    Message01Icon,
    InformationCircleIcon,
    Tick02Icon,
    TickDouble02Icon,
    SentIcon,
    Delete01Icon
} from "@hugeicons/core-free-icons";
import ChatSidebar from "@/components/dashboard/ChatSidebar";
import { MessageSkeleton } from "@/components/ui/Skeleton";
import { useUI } from "@/components/ui/UIProvider";

export default function ChatWindowPage() {
    const { id } = useParams();
    const router = useRouter();
    const [messages, setMessages] = useState([]);
    const [conversation, setConversation] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);
    const supabase = createClient();
    const { confirmAction, showToast } = useUI();

    useEffect(() => {
        const setupChat = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            setCurrentUser(session.user);

            // 1. Fetch conversation details (who am I talking to?)
            const { data: convData, error: convError } = await supabase
                .from('conversations')
                .select(`
                    *,
                    participants:conversation_participants(
                        user:users(id, display_name, profile_picture, username)
                    ),
                    gig:gigs(
                        id, title, price, category,
                        author:users(display_name, profile_picture)
                    )
                `)
                .eq('id', id)
                .single();

            if (convError) {
                console.error("Error fetching conversation:", convError);
                return;
            }

            const otherParticipant = convData.participants.find(p => p.user.id !== session.user.id);
            setConversation({
                ...convData,
                otherUser: otherParticipant?.user || { display_name: "User" }
            });

            // 2. Fetch messages
            const { data: msgData, error: msgError } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', id)
                .order('created_at', { ascending: true });

            if (!msgError) {
                setMessages(msgData || []);

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

            // 3. Subscribe to real-time updates
            const channel = supabase
                .channel(`chat:${id}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
                    (payload) => {
                        setMessages(prev => {
                            // Only add if it doesn't exist to prevent double-rendering from optimistic updates
                            if (prev.find(m => m.id === payload.new.id)) return prev;

                            // Check if this incoming real message matches an optimistic message we just sent
                            const optimisticMatch = prev.find(m =>
                                m.id.toString().startsWith('temp-') &&
                                m.sender_id === payload.new.sender_id &&
                                m.content === payload.new.content
                            );

                            if (optimisticMatch) {
                                // Replace the optimistic temp message with the real one
                                return prev.map(m => m.id === optimisticMatch.id ? payload.new : m);
                            }

                            return [...prev, payload.new];
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
                        setMessages(prev => prev.map(msg =>
                            msg.id === payload.new.id ? payload.new : msg
                        ));
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        setupChat();
    }, [id, supabase]);

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

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        const content = newMessage.trim();
        setNewMessage("");

        // OPTIMISTIC UI: Instantly add the message to the view
        const tempId = `temp-${Date.now()}`;
        const optimisticMsg = {
            id: tempId,
            conversation_id: id,
            sender_id: currentUser.id,
            content: content,
            created_at: new Date().toISOString(),
            is_read: false
        };

        setMessages(prev => [...prev, optimisticMsg]);

        const { error } = await supabase
            .from('messages')
            .insert({
                conversation_id: id,
                sender_id: currentUser.id,
                content: content
            });

        if (error) {
            console.error("Error sending message:", error);
            // Revert optimistic update on failure
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } else {
            // Update conversation updated_at and last_message
            await supabase
                .from('conversations')
                .update({
                    last_message: content,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);
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
                            <div className="size-10 rounded-full overflow-hidden border-2 border-[#ffc107]/20 shadow-sm relative shrink-0">
                                <img
                                    src={conversation?.otherUser.profile_picture}
                                    alt={conversation?.otherUser.display_name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="min-w-0 flex flex-col justify-center">
                                <h2 className="text-[15px] font-black text-gray-900 leading-tight truncate">{conversation?.otherUser.display_name}</h2>
                                {conversation?.otherUser.username && (
                                    <span className="text-[12px] font-medium text-gray-500 truncate">@{conversation.otherUser.username}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2.5 hover:bg-gray-50 rounded-full transition-colors">
                                <HugeiconsIcon icon={InformationCircleIcon} size={20} className="text-gray-400" />
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
                                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-gray-100 border border-gray-100">
                                    <img src={conversation.gig.author?.profile_picture} alt={conversation.gig.author?.display_name} className="w-full h-full object-cover" />
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

                        {messages.map((msg, idx) => {
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

                                        <div className={`px-5 py-3 rounded-[1.5rem] shadow-sm text-sm font-medium ${isMe
                                            ? 'bg-[#ffc107] text-black rounded-tr-none'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                            }`}>
                                            {msg.content}
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
                                        </div>

                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Input Area */}
                    <form
                        onSubmit={handleSendMessage}
                        className="fixed md:relative bottom-[64px] md:bottom-auto left-0 right-0 md:left-auto md:right-auto p-4 md:p-6 md:pt-0 shrink-0 bg-white/90 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none border-t border-gray-100 md:border-none z-10"
                    >
                        <div className="relative flex items-center bg-gray-50 rounded-[2rem] border border-gray-100 p-1.5 focus-within:border-[#ffc107]/50 focus-within:ring-4 focus-within:ring-[#ffc107]/5 transition-all shadow-sm">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Message..."
                                className="flex-1 bg-transparent border-none outline-none px-5 py-3 text-[14px] font-medium placeholder:text-gray-400"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="size-12 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none shrink-0"
                            >
                                <HugeiconsIcon icon={SentIcon} size={20} />
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
}
