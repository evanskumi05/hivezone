"use client";

import React from "react";
import Avatar from "@/components/ui/Avatar";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import UserBadge from "@/components/ui/UserBadge";

const MobileNotificationsPage = () => {
    const { notifications, loading, markAsRead, markAllAsRead, unreadCount, deleteNotification, clearAllNotifications } = useNotifications();
    const router = useRouter();

    const handleNotificationClick = async (notif) => {
        if (!notif.is_read) {
            await markAsRead(notif.id);
        }

        // Route based on entity type
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

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        await deleteNotification(id);
    };

    const handleClearAll = async () => {
        if (window.confirm("Are you sure you want to delete all notifications?")) {
            await clearAllNotifications();
        }
    };

    const getActionText = (type) => {
        switch (type) {
            case 'like': return 'Liked your post';
            case 'comment': return 'Commented on your feed';
            case 'gig_purchase': return 'Purchased your gig';
            case 'gig_inquiry': return 'Inquired about your gig';
            case 'message': return 'Sent you a message';
            default: return 'Sent a notification';
        }
    };

    const formatTimeAgo = (dateString) => {
        const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <div className="min-h-screen bg-[#fcf6de] px-0 md:hidden pb-20">
            <div className="flex items-center justify-between mt-4 mb-6 px-4">
                <h1 className="text-2xl font-black font-newyork text-gray-900 tracking-tight">Notifications</h1>
                <div className="flex gap-4 px-4">
                    {notifications.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="text-[13px] font-bold text-red-500 hover:text-red-600 transition-colors"
                        >
                            Clear all
                        </button>
                    )}
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-[13px] font-bold text-[#ffc107] hover:text-[#e09e00] transition-colors"
                        >
                            Mark all read
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-0 border-t border-gray-100">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffc107]"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 font-medium">No notifications yet</div>
                ) : notifications.map((notif) => (
                    <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`flex items-start gap-4 p-4 border-b border-gray-100 cursor-pointer active:scale-[0.98] transition-all group relative ${notif.is_read ? 'bg-transparent' : 'bg-[#ffc107]/5'}`}
                    >
                        <div className="shrink-0">
                            <Avatar
                                src={notif.actor?.profile_picture}
                                name={notif.actor?.computedName || "?"}
                                className="w-12 h-12 rounded-full border border-gray-100"
                            />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col pt-0.5">
                            <div className="flex justify-between items-start gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <p className="text-[14px] font-bold text-gray-900 truncate leading-tight">
                                        {notif.actor?.computedName || "User"}
                                    </p>
                                    <UserBadge 
                                        isAdmin={notif.actor?.is_admin} 
                                        isVerified={notif.actor?.is_verified} 
                                        size="xs"
                                    />
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, notif.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors"
                                >
                                    <HugeiconsIcon icon={Delete02Icon} size={14} />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">Delete</span>
                                </button>
                            </div>
                            <p className={`text-[13px] mt-1 ${notif.is_read ? 'font-medium text-gray-600' : 'font-bold text-gray-900'}`}>
                                {notif.message || getActionText(notif.type)}
                            </p>
                        </div>
                        <div className={`text-[12px] shrink-0 whitespace-nowrap self-start mt-1 ${notif.is_read ? 'font-semibold text-gray-400' : 'font-bold text-[#ffc107]'}`}>
                            {formatTimeAgo(notif.created_at)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MobileNotificationsPage;
