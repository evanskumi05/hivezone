"use client";

import React from "react";
import Image from "next/image";

import { useNotifications } from "@/components/providers/NotificationProvider";
import { useRouter } from "next/navigation";

const MobileNotificationsPage = () => {
    const { notifications, loading, markAsRead } = useNotifications();
    const router = useRouter();

    const handleNotificationClick = async (notif) => {
        if (!notif.is_read) {
            await markAsRead(notif.id);
        }

        // Route based on entity type
        switch (notif.entity_type) {
            case 'feed':
                // Assuming we have a feed detail page or just go to feed
                router.push(`/dashboard/feed`);
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
        <div className="min-h-screen bg-[#fcf6de] px-4 md:hidden pb-20">
            <h1 className="text-2xl font-black font-newyork text-gray-900 mt-4 mb-6 tracking-tight">Notifications</h1>

            <div className="flex flex-col gap-2">
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
                        className={`flex items-start gap-4 p-4 bg-white rounded-[1.25rem] shadow-sm border ${notif.is_read ? 'border-gray-100' : 'border-[#ffc107]/50 bg-[#ffc107]/5'} cursor-pointer active:scale-[0.98] transition-all`}
                    >
                        <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0 border border-gray-100 overflow-hidden relative">
                            {notif.actor?.profile_picture ? (
                                <img
                                    src={notif.actor.profile_picture}
                                    alt={notif.actor.display_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 font-bold">
                                    {notif.actor?.display_name?.charAt(0) || '?'}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col pt-0.5">
                            <p className="text-[14px] font-bold text-gray-900 truncate leading-tight">
                                {notif.actor?.display_name || "Someone"}
                            </p>
                            <p className={`text-[13px] truncate mt-0.5 ${notif.is_read ? 'font-medium text-gray-600' : 'font-bold text-gray-900'}`}>
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
