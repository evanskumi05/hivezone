"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { getDisplayName } from "@/utils/stringUtils";

const ChatContext = createContext({
    unreadCount: 0,
    conversations: [],
    loadingConversations: true,
    messagesCache: {},
    setActiveConversation: () => { },
    updateMessagesCache: () => { },
    hideConversation: async () => { },
    refreshUnreadCount: () => { },
    refreshConversations: () => { }
});

export const useChatConfig = () => useContext(ChatContext);

export default function ChatProvider({ children }) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [conversations, setConversations] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [messagesCache, setMessagesCache] = useState({});
    const activeConversationRef = useRef(null);
    const supabase = createClient();

    const setActiveConversation = useCallback((id) => {
        activeConversationRef.current = id;
        if (id) {
            // Immediately zero out the unread badge for this conversation
            setConversations(prev => prev.map(c =>
                c.id === id ? { ...c, unreadCount: 0 } : c
            ));
        }
    }, []);

    const updateMessagesCache = useCallback((id, messages) => {
        setMessagesCache(prev => {
            const newCache = { ...prev };
            
            // Limit to last 70 messages (matching the fetch limit)
            const limitedMessages = messages.slice(0, 70);
            newCache[id] = limitedMessages;

            // Limit cache to 5 conversations total
            const keys = Object.keys(newCache);
            if (keys.length > 5) {
                // Remove the oldest conversation that isn't the active one
                const oldestKey = keys.find(k => k !== id && k !== activeConversationRef.current) || keys[0];
                delete newCache[oldestKey];
            }

            return newCache;
        });
    }, []);

    const fetchConversations = async (sessionParam = null) => {
        const session = sessionParam || (await supabase.auth.getSession()).data.session;
        if (!session) return;

        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                participants:conversation_participants(
                    user:users(id, display_name, first_name, profile_picture, username, is_verified, is_admin)
                ),
                gig:gigs(title),
                unread_messages:messages (id)
            `)
            .eq('unread_messages.is_read', false)
            .neq('unread_messages.sender_id', session.user.id)
            .not('hidden_by', 'cs', `{${session.user.id}}`)
            .order('updated_at', { ascending: false });

        if (!error) {
            const formatted = data.map(conv => {
                const otherParticipant = conv.participants.find(p => p.user.id !== session.user.id);
                const otherUserRaw = otherParticipant?.user;
                const unreadCount = conv.unread_messages ? conv.unread_messages.length : 0;
                return {
                    ...conv,
                    otherUser: otherUserRaw ? { ...otherUserRaw, computedName: getDisplayName(otherUserRaw) } : { computedName: "Somebody", display_name: "Somebody" },
                    unreadCount
                };
            });
            setConversations(formatted);
        }
        setLoadingConversations(false);
    };

    const hideConversation = async (conversationId) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Optimistically remove from sidebar
        setConversations(prev => prev.filter(c => c.id !== conversationId));

        // Fetch current conversation to append to hidden_by array
        const { data: conv } = await supabase
            .from('conversations')
            .select('hidden_by')
            .eq('id', conversationId)
            .single();

        if (conv) {
            const currentHiddenBy = conv.hidden_by || [];
            if (!currentHiddenBy.includes(session.user.id)) {
                await supabase
                    .from('conversations')
                    .update({ hidden_by: [...currentHiddenBy, session.user.id] })
                    .eq('id', conversationId);
            }
        }
    };

    const fetchUnreadCount = useCallback(async (sessionParam = null) => {
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
    }, [supabase]);

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

        // 1. Subscribe to basic unread "alerts" globally (Inbox pattern)
        const channel = supabase
            .channel('global-inbox')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const newMsg = payload.new;
                    const isActiveChat = newMsg.conversation_id === activeConversationRef.current;

                    // Only update global counts if it's NOT the active chat (page-level handles active)
                    if (!isActiveChat) {
                        fetchUnreadCount(currentSession);
                        fetchConversations(currentSession);
                    } else {
                        // Active chat: still refresh sidebar preview for sender's own messages
                        fetchConversations(currentSession);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'messages' },
                () => {
                    // Update unread badges when is_read status changes
                    fetchUnreadCount(currentSession);
                    fetchConversations(currentSession);
                }
            )
            .subscribe();

        // 2. Lazy sync on focus (catches missed messages during sleep/background)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && currentSession) {
                fetchUnreadCount(currentSession);
                fetchConversations(currentSession);
            }
        };
        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleVisibilityChange);

        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleVisibilityChange);
        };
    }, []);

    return (
        <ChatContext.Provider value={{
            unreadCount,
            conversations,
            loadingConversations,
            messagesCache,
            setActiveConversation,
            updateMessagesCache,
            hideConversation,
            refreshUnreadCount: fetchUnreadCount,
            refreshConversations: fetchConversations
        }}>
            {children}
        </ChatContext.Provider>
    );
}
