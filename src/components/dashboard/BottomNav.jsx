"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Home01Icon,
    Briefcase02Icon, // Representing Campus Gigs/Search
    Notification01Icon,
    Mail01Icon,
} from "@hugeicons/core-free-icons";
import { useChatConfig } from "@/components/providers/ChatProvider";
import { useNotifications } from "@/components/providers/NotificationProvider";

const BottomNav = () => {
    const pathname = usePathname();
    const { unreadCount: chatUnreadCount } = useChatConfig();
    const { unreadCount: notificationUnreadCount } = useNotifications();

    const tabs = [
        {
            name: "Home",
            href: "/dashboard",
            icon: Home01Icon,
            isActive: pathname === "/dashboard",
        },
        {
            name: "Gigs",
            href: "/dashboard/gigs",
            icon: Briefcase02Icon,
            isActive: pathname === "/dashboard/gigs",
        },
        {
            name: "Notifications",
            href: "/dashboard/notifications",
            icon: Notification01Icon,
            isActive: pathname.startsWith("/dashboard/notifications"),
            hasBadge: notificationUnreadCount > 0,
            badgeCount: notificationUnreadCount > 99 ? '99+' : notificationUnreadCount
        },
        {
            name: "Messages",
            href: "/dashboard/chat",
            icon: Mail01Icon,
            isActive: pathname.startsWith("/dashboard/chat"),
            hasBadge: chatUnreadCount > 0,
            badgeCount: chatUnreadCount > 99 ? '99+' : chatUnreadCount
        },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#fcf6de] border-t border-gray-300 z-40 px-4 py-2 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
                {tabs.map((tab) => (
                    <Link
                        key={tab.name}
                        href={tab.href}
                        className="relative flex flex-col items-center justify-center w-full p-2 py-3 transition-colors"
                    >
                        <div className="relative">
                            <HugeiconsIcon
                                icon={tab.icon}
                                className={`w-7 h-7 transition-colors ${tab.isActive ? "text-black" : "text-gray-500"}`}
                                strokeWidth={tab.isActive ? 2 : 1.5}
                            />
                            {tab.hasBadge && tab.badgeCount && (
                                <span className={`absolute -top-1 -right-1.5 min-w-[16px] h-[16px] px-1 bg-[#ff3b30] text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-[#fcf6de]`}>
                                    {tab.badgeCount}
                                </span>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default BottomNav;
