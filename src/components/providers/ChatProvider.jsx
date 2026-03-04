"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

const ChatContext = createContext({
    unreadCount: 0,
    conversations: [],
    loadingConversations: true,
    refreshUnreadCount: () => { },
    refreshConversations: () => { }
});

export const useChatConfig = () => useContext(ChatContext);

export default function ChatProvider({ children }) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [conversations, setConversations] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const supabase = createClient();

    const fetchConversations = async (sessionParam = null) => {
        const session = sessionParam || (await supabase.auth.getSession()).data.session;
        if (!session) return;

        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                participants:conversation_participants(
                    user:users(id, display_name, profile_picture, username)
                ),
                gig:gigs(title),
                unread_messages:messages (id)
            `)
            .eq('unread_messages.is_read', false)
            .neq('unread_messages.sender_id', session.user.id)
            .order('updated_at', { ascending: false });

        if (!error) {
            const formatted = data.map(conv => {
                const otherParticipant = conv.participants.find(p => p.user.id !== session.user.id);
                const unreadCount = conv.unread_messages ? conv.unread_messages.length : 0;
                return {
                    ...conv,
                    otherUser: otherParticipant?.user || { display_name: "User" },
                    unreadCount
                };
            });
            setConversations(formatted);
        }
        setLoadingConversations(false);
    };

    const fetchUnreadCount = async (sessionParam = null) => {
        const session = sessionParam || (await supabase.auth.getSession()).data.session;
        if (!session) return;

        // Fetch all conversations for the user
        const { data: convs, error: convError } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', session.user.id);

        if (convError || !convs.length) return;

        const convIds = convs.map(c => c.conversation_id);

        // Count messages that are in those conversations, unread, and NOT sent by the current user
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', convIds)
            .eq('is_read', false)
            .neq('sender_id', session.user.id);

        if (!error && count !== null) {
            setUnreadCount(count);
        }
    };

    useEffect(() => {
        let currentSession = null;

        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            currentSession = session;
            if (session) {
                await Promise.all([
                    fetchUnreadCount(session),
                    fetchConversations(session)
                ]);
            } else {
                setLoadingConversations(false);
            }
        };

        init();

        // Subscribe to messages changes globally
        const channel = supabase
            .channel('global-chat')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    // Update exact unread count
                    fetchUnreadCount();

                    // Instantly update conversations list (sort & last_message)
                    setConversations(prev => {
                        const newMsg = payload.new;
                        const convIndex = prev.findIndex(c => c.id === newMsg.conversation_id);

                        if (convIndex > -1) {
                            const updatedConvs = [...prev];
                            const conv = updatedConvs[convIndex];

                            const isIncoming = newMsg.sender_id !== currentSession?.user?.id;

                            // NOTE: Since this is global, we don't know the strictly `activeId` of the chat window. 
                            // But `fetchUnreadCount` handles the precise counts. We just lazily increment visually here.
                            const updatedConv = {
                                ...conv,
                                last_message: newMsg.content,
                                updated_at: newMsg.created_at,
                                unreadCount: isIncoming ? conv.unreadCount + 1 : conv.unreadCount
                            };

                            updatedConvs.splice(convIndex, 1);
                            updatedConvs.unshift(updatedConv);
                            return updatedConvs;
                        } else {
                            fetchConversations(currentSession);
                            return prev;
                        }
                    });
                }
            )
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'messages' },
                () => {
                    // Update exact counts and fetch the new last_message from server
                    fetchUnreadCount();
                    fetchConversations(currentSession);
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'conversations' },
                () => {
                    // This explicitly ensures the sidebar updates when the conversation's last_message is manually patched by our delete function
                    fetchConversations(currentSession);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <ChatContext.Provider value={{
            unreadCount,
            conversations,
            loadingConversations,
            refreshUnreadCount: fetchUnreadCount,
            refreshConversations: fetchConversations
        }}>
            {children}
        </ChatContext.Provider>
    );
}
