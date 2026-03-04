"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

const NotificationContext = createContext({
    unreadCount: 0,
    notifications: [],
    loading: true,
    markAsRead: async () => { },
    markAllAsRead: async () => { }
});

export const useNotifications = () => useContext(NotificationContext);

export default function NotificationProvider({ children }) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchNotifications = async (sessionParam = null) => {
        const session = sessionParam || (await supabase.auth.getSession()).data.session;
        if (!session) return;

        // Fetch notifications with actor details
        const { data, error } = await supabase
            .from('notifications')
            .select(`
                *,
                actor:users!actor_id (display_name, profile_picture, username)
            `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        }
        setLoading(false);
    };

    const fetchUnreadCount = async (sessionParam = null) => {
        const session = sessionParam || (await supabase.auth.getSession()).data.session;
        if (!session) return;

        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .eq('is_read', false);

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
                await fetchNotifications(session);
            } else {
                setLoading(false);
            }
        };

        init();

        // Subscribe to real-time notification changes
        const channel = supabase
            .channel('global-notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    // Only react if the notification belongs to the current user
                    if (currentSession && payload.new.user_id === currentSession.user.id) {
                        fetchNotifications(currentSession);
                        fetchUnreadCount(currentSession);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'notifications' },
                (payload) => {
                    if (currentSession && payload.new.user_id === currentSession.user.id) {
                        fetchNotifications(currentSession);
                        fetchUnreadCount(currentSession);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'notifications' },
                (payload) => {
                    if (currentSession && payload.old.user_id === currentSession.user.id) {
                        fetchNotifications(currentSession);
                        fetchUnreadCount(currentSession);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const markAsRead = async (notificationId) => {
        // Optimistic UI update
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) {
            // Revert on failure
            fetchNotifications();
        }
    };

    const markAllAsRead = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Optimistic
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', session.user.id)
            .eq('is_read', false);

        if (error) {
            fetchNotifications();
        }
    };

    return (
        <NotificationContext.Provider value={{
            unreadCount,
            notifications,
            loading,
            markAsRead,
            markAllAsRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
}
