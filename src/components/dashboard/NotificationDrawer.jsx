"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Cancel01Icon,
    Delete02Icon,
    Notification01Icon
} from "@hugeicons/core-free-icons";
import Avatar from "@/components/ui/Avatar";
import { useRouter } from 'next/navigation';

import { requestNotificationPermission, getNotificationPermissionStatus } from "@/utils/OneSignalNative";

const NotificationDrawer = ({
    isOpen,
    onClose,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    formatTimeAgo,
    getActionText
}) => {
    const router = useRouter();
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [hasPushPermission, setHasPushPermission] = useState(true);

    React.useEffect(() => {
        if (isOpen) {
            checkPermission();
        }
    }, [isOpen]);

    const checkPermission = async () => {
        const status = await getNotificationPermissionStatus();
        setHasPushPermission(status === true || status === 'granted');
    };

    const handleEnablePush = async () => {
        const accepted = await requestNotificationPermission();
        if (accepted) {
            setHasPushPermission(true);
        }
    };

    const handleNotificationClick = async (notif) => {
        onClose();
        if (!notif.is_read) {
            await markAsRead(notif.id);
        }

        switch (notif.entity_type) {
            case 'feed':
                router.push(`/dashboard/feed/${notif.entity_id}`);
                break;
            case 'gig':
                router.push(`/dashboard/gigs/detail?id=${notif.entity_id}`);
                break;
            case 'message':
                router.push(`/dashboard/chat/${notif.entity_id}`);
                break;
            default:
                break;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                    />

                    {/* Drawer Panel */}
                    <div className="absolute inset-y-0 right-0 max-w-full flex">
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 350, restDelta: 0.01 }}
                            className="w-screen max-w-md"
                        >
                            <div className="h-full flex flex-col bg-white shadow-2xl border-l border-gray-100">
                                {/* Header */}
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#ffc107]/10 rounded-2xl flex items-center justify-center">
                                                <HugeiconsIcon icon={Notification01Icon} className="w-6 h-6 text-[#ffc107]" strokeWidth={2} />
                                            </div>
                                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Notifications</h2>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="p-2.5 hover:bg-gray-100 rounded-2xl transition-all duration-200 text-gray-400 group"
                                        >
                                            <HugeiconsIcon icon={Cancel01Icon} className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-gray-500">
                                            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                                        </span>
                                        <div className="flex gap-4">
                                            {notifications.length > 0 && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setShowClearConfirm(true); }}
                                                    className="text-[13px] font-bold text-red-500 hover:text-red-600 transition-colors"
                                                >
                                                    Clear all
                                                </button>
                                            )}
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                                                    className="text-[13px] font-bold text-[#ffc107] hover:text-[#e09e00] transition-colors"
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                                    {/* Push Notification Opt-in Banner */}
                                    {/* Push Notification Toggle Section */}
                                    <div className="mb-4 p-4 bg-gray-50 border border-gray-100 rounded-[2rem] flex items-center justify-between shadow-sm group hover:border-[#ffc107]/30 transition-all duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-50">
                                                <HugeiconsIcon icon={Notification01Icon} className={`w-5 h-5 ${hasPushPermission ? 'text-[#ffc107]' : 'text-gray-400'}`} strokeWidth={2} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[14px] font-black text-gray-900 tracking-tight">Push Alerts</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    {hasPushPermission ? 'Active' : 'Off'}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleEnablePush}
                                            disabled={hasPushPermission}
                                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-500 outline-none
                                                ${hasPushPermission ? 'bg-[#ffc107] shadow-lg shadow-yellow-100' : 'bg-gray-200'}
                                                ${hasPushPermission ? 'cursor-default' : 'cursor-pointer hover:scale-105 active:scale-95'}
                                            `}
                                        >
                                            <span className="sr-only">Toggle Push Alerts</span>
                                            <span
                                                className={`${
                                                    hasPushPermission ? 'translate-x-6 bg-white shadow-sm' : 'translate-x-1.5 bg-gray-400'
                                                } inline-block h-4.5 w-4.5 transform rounded-full transition-all duration-500 ease-in-out`}
                                            />
                                        </button>
                                    </div>

                                    {notifications.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center px-6">
                                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                <HugeiconsIcon icon={Notification01Icon} className="w-10 h-10 text-gray-200" />
                                            </div>
                                            <p className="text-gray-900 font-bold text-lg mb-1">No notifications yet</p>
                                            <p className="text-gray-500 text-sm">When you get updates, they'll show up here.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {notifications.map((notif) => (
                                                <div
                                                    key={notif.id}
                                                    onClick={() => handleNotificationClick(notif)}
                                                    className={`relative flex items-center gap-4 p-4 rounded-3xl cursor-pointer transition-all duration-300 group ${notif.is_read ? 'hover:bg-gray-50' : 'bg-[#ffc107]/5 border border-[#ffc107]/10 hover:bg-[#ffc107]/10Shadow shadow-[#ffc107]/5'}`}
                                                >
                                                    {!notif.is_read && (
                                                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#ffc107] rounded-full shadow-lg shadow-[#ffc107]/50" />
                                                    )}

                                                    <div className="shrink-0 relative">
                                                        <Avatar
                                                            src={notif.actor?.profile_picture}
                                                            name={notif.actor?.computedName || "User"}
                                                            className="w-12 h-12 rounded-full border border-gray-100 shadow-sm"
                                                        />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-0.5">
                                                            <p className="text-[14px] font-black text-gray-900 truncate">
                                                                {notif.actor?.computedName || "User"}
                                                            </p>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                                                                className="p-1.5 -mr-1.5 text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                                                            >
                                                                <HugeiconsIcon icon={Delete02Icon} size={16} />
                                                            </button>
                                                        </div>
                                                        <p className={`text-[13px] leading-relaxed ${notif.is_read ? 'font-medium text-gray-600' : 'font-bold text-gray-900'}`}>
                                                            {notif.message || getActionText(notif.type)}
                                                        </p>
                                                        <p className="text-[11px] font-bold text-gray-400 mt-2 flex items-center gap-1.5 uppercase tracking-wider">
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                            {formatTimeAgo(notif.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Inline Confirm Modal */}
                                <AnimatePresence>
                                    {showClearConfirm && (
                                        <div className="absolute inset-0 z-[10001] flex items-center justify-center p-6">
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.1 }}
                                                className="absolute inset-0 bg-white/60 backdrop-blur-md"
                                                onClick={() => setShowClearConfirm(false)}
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: 15 }}
                                                transition={{
                                                    type: "spring",
                                                    damping: 25,
                                                    stiffness: 400,
                                                    duration: 0.15
                                                }}
                                                className="relative bg-white w-full rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 flex flex-col items-center text-center"
                                            >
                                                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6">
                                                    <HugeiconsIcon icon={Delete02Icon} size={32} strokeWidth={2.5} />
                                                </div>
                                                <h3 className="text-xl font-black text-gray-900 mb-2">Clear notifications?</h3>
                                                <p className="text-gray-500 text-sm font-medium mb-8">
                                                    This will permanently remove all your notifications.
                                                </p>
                                                <div className="flex flex-col w-full gap-3">
                                                    <button
                                                        onClick={() => {
                                                            clearAllNotifications();
                                                            setShowClearConfirm(false);
                                                        }}
                                                        className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-100 transition-all active:scale-[0.98]"
                                                    >
                                                        Yes, clear all
                                                    </button>
                                                    <button
                                                        onClick={() => setShowClearConfirm(false)}
                                                        className="w-full py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default NotificationDrawer;
