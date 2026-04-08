"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { getDisplayName } from "@/utils/stringUtils";
import { getNotificationPermissionStatus, requestNotificationPermission } from "@/utils/OneSignalNative";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

const NotificationContext = createContext({
    unreadCount: 0,
    notifications: [],
    loading: true,
    markAsRead: async () => { },
    markAllAsRead: async () => { },
    deleteNotification: async () => { },
    clearAllNotifications: async () => { }
});

export const useNotifications = () => useContext(NotificationContext);

export default function NotificationProvider({ children }) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSoftPrompt, setShowSoftPrompt] = useState(false);
    const supabase = createClient();

    const fetchNotifications = async (sessionParam = null) => {
        const session = sessionParam || (await supabase.auth.getSession()).data.session;
        if (!session) return;

        // Fetch notifications with actor details
        const { data, error } = await supabase
            .from('notifications')
            .select(`
                *,
                actor:users!actor_id (display_name, first_name, profile_picture, username, is_verified, is_admin)
            `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            const formattedData = data.map(notif => ({
                ...notif,
                actor: notif.actor ? { ...notif.actor, computedName: getDisplayName(notif.actor) } : null
            }));

            setNotifications(formattedData);
            setUnreadCount(formattedData.filter(n => !n.is_read).length);
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
        let softPromptTimer = null;
        let channel = null;

        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            currentSession = session;
            if (session) {
                await fetchNotifications(session);
            } else {
                setLoading(false);
            }

            // Soft prompt — only after user is loaded
            softPromptTimer = setTimeout(async () => {
                const status = await getNotificationPermissionStatus();
                if (status === 'default' && !localStorage.getItem('has_prompted_notifications')) {
                    setShowSoftPrompt(true);
                    localStorage.setItem('has_prompted_notifications', 'true');
                }
            }, 2000);

            if (!session) return;

            // Subscribe with user-scoped filter so only this user's notifications fire
            channel = supabase
                .channel('global-notifications')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` },
                    () => fetchNotifications(currentSession)
                )
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` },
                    () => fetchNotifications(currentSession)
                )
                .on(
                    'postgres_changes',
                    { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` },
                    () => fetchNotifications(currentSession)
                )
                .subscribe();
        };

        init();

        return () => {
            clearTimeout(softPromptTimer);
            if (channel) supabase.removeChannel(channel);
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

    const deleteNotification = async (notificationId) => {
        // Optimistic UI update
        const notificationToDelete = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (notificationToDelete && !notificationToDelete.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

        if (error) {
            // Revert on failure
            fetchNotifications();
        }
    };

    const clearAllNotifications = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Optimistic
        setNotifications([]);
        setUnreadCount(0);

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', session.user.id);

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
            markAllAsRead,
            deleteNotification,
            clearAllNotifications
        }}>
            {children}

            {/* Industry Standard Soft Prompt Modal */}
            <AnimatePresence>
                {showSoftPrompt && (
                    <div className="fixed inset-0 z-[20000] flex items-end sm:items-center justify-center p-4 sm:p-6">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSoftPrompt(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-[4px]"
                        />
                        
                        {/* Modal Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 100, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 100, scale: 0.95 }}
                            transition={{ type: "spring", damping: 30, stiffness: 400 }}
                            className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 flex flex-col items-center text-center overflow-hidden"
                        >
                            {/* Decorative background pulse */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#ffc107]/20" />
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#ffc107]/5 rounded-full blur-3xl" />
                            
                            <div className="w-20 h-20 bg-[#ffc107]/10 rounded-3xl flex items-center justify-center mb-6 relative">
                                <HugeiconsIcon icon={Notification01Icon} className="w-10 h-10 text-[#ffc107]" strokeWidth={2} />
                                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffc107] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-[#ffc107]"></span>
                                </span>
                            </div>

                            <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight font-newyork">Stay in the hive!</h3>
                            <p className="text-gray-500 font-medium text-[15px] leading-relaxed mb-8">
                                Don't miss out on campus <b>gigs</b>, <b>study circles</b>, and important updates in your zone.
                            </p>

                            <div className="flex flex-col w-full gap-3">
                                <button
                                    onClick={async () => {
                                        setShowSoftPrompt(false);
                                        await requestNotificationPermission();
                                    }}
                                    className="w-full py-4 bg-[#ffc107] hover:bg-yellow-400 text-gray-900 font-black rounded-2xl shadow-xl shadow-yellow-100 transition-all active:scale-[0.98]"
                                >
                                    Keep me updated
                                </button>
                                <button
                                    onClick={() => setShowSoftPrompt(false)}
                                    className="w-full py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition-all"
                                >
                                    Not now
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </NotificationContext.Provider>
    );
}
