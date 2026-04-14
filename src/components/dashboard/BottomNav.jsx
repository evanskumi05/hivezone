"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Home01Icon,
    Briefcase02Icon,
    Search01Icon,
    UserGroupIcon,
    BubbleChatIcon,
} from "@hugeicons/core-free-icons";
import { useChatConfig } from "@/components/providers/ChatProvider";

const BottomNav = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { unreadCount: chatUnreadCount } = useChatConfig();

    const tabs = [
        {
            name: "Home",
            href: "/dashboard",
            icon: Home01Icon,
            isActive: pathname === "/dashboard",
        },
        {
            name: "Search",
            href: "/dashboard/search",
            icon: Search01Icon,
            isActive: pathname.startsWith("/dashboard/search"),
        },
        {
            name: "Gigs",
            href: "/dashboard/gigs",
            icon: Briefcase02Icon,
            isActive: pathname.startsWith("/dashboard/gigs"),
        },
        {
            name: "Communities",
            href: "/dashboard/communities",
            icon: UserGroupIcon,
            isActive: pathname.startsWith("/dashboard/communities"),
        },
        {
            name: "Messages",
            href: "/dashboard/chat",
            icon: BubbleChatIcon,
            isActive: pathname.startsWith("/dashboard/chat"),
            hasBadge: chatUnreadCount > 0,
            badgeCount: chatUnreadCount > 99 ? '99+' : chatUnreadCount
        },
    ];

    const handleTabClick = (e, tab) => {
        e.preventDefault();
        
        if (tab.isActive) {
            let scrolled = false;

            // 1. Check Virtual feed scrollers (Home feed uses this)
            const virtuosoScroller = document.getElementById('dashboard-scroll-container');
            if (virtuosoScroller && virtuosoScroller.scrollTop > 0) {
                virtuosoScroller.scrollTo({ top: 0, behavior: 'smooth' });
                scrolled = true;
            }
            
            // 2. Check Global Layout Scroller (Gigs, Search, Messages use this)
            const mainScroller = document.getElementById('main-scroll-area');
            if (mainScroller && mainScroller.scrollTop > 0) {
                mainScroller.scrollTo({ top: 0, behavior: 'smooth' });
                scrolled = true;
            }
            
            // 3. Standard window scroll fallback
            if (!scrolled && window.scrollY > 0) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } else {
            router.push(tab.href);
        }
    };

    // Hide BottomNav on feed detail pages and study circle detail pages to allow fixed reply bar
    const isFeedDetail = pathname.startsWith("/dashboard/feed/") && pathname !== "/dashboard/feed";
    const isCircleDetail = pathname.startsWith("/dashboard/study-circles/") && pathname !== "/dashboard/study-circles" && !pathname.endsWith("/create");
    const isChatDetail = pathname.startsWith("/dashboard/chat/") && pathname !== "/dashboard/chat" && !pathname.endsWith("/new");
    
    if (isFeedDetail || isCircleDetail || isChatDetail) return null;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#fcf6de] border-t border-gray-300 z-[60] px-4 py-2 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.02)] pt-1">
            <div className="flex items-center justify-between">
                {tabs.map((tab) => (
                    <button
                        key={tab.name}
                        onClick={(e) => handleTabClick(e, tab)}
                        className="relative flex flex-col items-center justify-center w-full p-2 py-3 transition-colors cursor-pointer outline-none"
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
                    </button>
                ))}
            </div>
        </div>
    );
};

export default BottomNav;
