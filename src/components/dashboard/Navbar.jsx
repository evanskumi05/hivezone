"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Avatar from "@/components/ui/Avatar";
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useChatConfig } from '@/components/providers/ChatProvider';
import { useNotifications } from '@/components/providers/NotificationProvider';
import { getDisplayName } from '@/utils/stringUtils';
import NotificationDrawer from './NotificationDrawer';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Search01Icon,
    Notification01Icon,
    Settings01Icon,
    ArrowDown01Icon,
    UserIcon,
    LogoutCircle02Icon,
    BubbleChatIcon,
} from "@hugeicons/core-free-icons";

const Navbar = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isMobileNotifOpen, setIsMobileNotifOpen] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const dropdownRef = useRef(null);
    const notifRef = useRef(null);
    const mobileNotifRef = useRef(null);
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const [profile, setProfile] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const { unreadCount: chatUnreadCount } = useChatConfig();
    const { unreadCount: notificationUnreadCount, notifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } = useNotifications();

    const triggerSearch = () => {
        if (searchQuery.trim()) {
            router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            triggerSearch();
        }
    };

    const handleNotificationClick = async (notif) => {
        setIsNotifOpen(false);
        setIsMobileNotifOpen(false);
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

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
            if (mobileNotifRef.current && !mobileNotifRef.current.contains(event.target)) {
                setIsMobileNotifOpen(false);
            }
        };

        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data, error } = await supabase
                    .from("users")
                    .select("id, display_name, first_name, username, profile_picture, is_admin")
                    .eq("id", session.user.id)
                    .single();
                if (data) {
                    setProfile(data);
                } else if (error) {
                    console.error("Error fetching user for navbar:", error);
                }
            }
        };

        fetchUser();
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [supabase]);

    // Lock body scroll when mobile sidebar is open
    useEffect(() => {
        if (isMobileSidebarOpen) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }
        return () => document.body.classList.remove('overflow-hidden');
    }, [isMobileSidebarOpen]);

    // Clear search bar when navigating away from search page
    useEffect(() => {
        if (pathname !== '/dashboard/search') {
            setSearchQuery("");
        }
    }, [pathname]);

    const handleSignOut = async () => {
        setIsDropdownOpen(false);
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error);
            return;
        }
        router.push('/auth/signin');
        router.refresh();
    };

    // Custom Logo click behavior (scroll to top if scrolled down, else go to dashboard)
    const handleLogoClick = (e) => {
        e.preventDefault();
        
        // IF ON DASHBOARD: Use central event to clear memory and scrollers
        if (pathname === '/dashboard') {
            window.dispatchEvent(new CustomEvent('HZ_NAV_LOGO_CLICK'));
            return;
        }

        // Check for our custom scroll containers used in Search/Profile
        const dashboardContainer = document.getElementById('dashboard-scroll-container');
        if (dashboardContainer && dashboardContainer.scrollTop > 0) {
            dashboardContainer.scrollTo({ top: 0, behavior: 'auto' });
            return;
        }

        const mainContainer = document.getElementById('main-scroll-area');
        if (mainContainer && mainContainer.scrollTop > 0) {
            mainContainer.scrollTo({ top: 0, behavior: 'auto' });
            return;
        }

        // Check standard window scroll last
        if (window.scrollY > 0) {
            window.scrollTo({ top: 0, behavior: 'auto' });
            return;
        }

        // Already at the top, so act as a link
        if (pathname !== '/dashboard') {
            router.push('/dashboard');
        }
    };

    // Determine page name from URL
    const getPageName = () => {
        if (!pathname || pathname === '/dashboard') return 'Overview';

        // E.g. /dashboard/settings -> ["", "dashboard", "settings"]
        const parts = pathname.split('/').filter(Boolean);
        if (parts.length > 1) {
            const page = parts[1]; // Get the word after 'dashboard'
            // Handle specific cases if needed, otherwise capitalize
            return page.charAt(0).toUpperCase() + page.slice(1).replace('-', ' ');
        }

        return 'Overview';
    };

    return (
        <nav className="w-full text-zinc-800 bg-[#fcf6de] px-4 py-3 md:px-6 md:py-4 sticky top-0 z-50">
            {/* --- MOBILE NAVIGATION --- */}
            <div className="flex items-center justify-between w-full md:hidden relative">
                {/* Left: Profile Pic */}
                <button onClick={() => setIsMobileSidebarOpen(true)} className="flex items-center shrink-0 w-9 h-9 rounded-full bg-blue-500 overflow-hidden shadow-sm border border-gray-200">
                    <Avatar src={profile?.profile_picture} name={getDisplayName(profile, "User")} className="w-full h-full rounded-full" />
                </button>

                {/* Center: Logo */}
                <button onClick={handleLogoClick} className="flex items-center justify-center absolute left-1/2 -translate-x-1/2 cursor-pointer transition-transform active:scale-95">
                    <div className="relative flex items-center gap-2">
                        <Image src="/logo.svg" alt="HiveZone Logo" width={110} height={32} priority className="h-6 w-auto relative z-10" />
                        <span className="absolute -top-1.5 -right-8 bg-black text-[#ffc107] text-[8px] font-bold px-1.5 py-0.5 rounded-[3px] tracking-widest shadow-sm rotate-12">
                            BETA
                        </span>
                    </div>
                </button>



                {/* Right: Settings and Notifications */}
                <div className="flex items-center gap-2">
                    {/* Mobile Notification Widget Container */}
                    <div className="relative" ref={mobileNotifRef}>
                        <div
                            onClick={() => setIsMobileNotifOpen(!isMobileNotifOpen)}
                            className={`relative w-9 h-9 bg-white border ${isMobileNotifOpen ? 'border-black' : 'border-gray-200'} rounded-full flex items-center justify-center shadow-sm cursor-pointer shrink-0`}
                        >
                            <HugeiconsIcon icon={Notification01Icon} className="w-[18px] h-[18px] text-gray-800" strokeWidth={1.5} />
                            {notificationUnreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-[#ff3b30] text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                                    {notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}
                                </span>
                            )}
                        </div>

                        <NotificationDrawer
                            isOpen={isMobileNotifOpen}
                            onClose={() => setIsMobileNotifOpen(false)}
                            notifications={notifications}
                            unreadCount={notificationUnreadCount}
                            markAsRead={markAsRead}
                            markAllAsRead={markAllAsRead}
                            deleteNotification={deleteNotification}
                            clearAllNotifications={clearAllNotifications}
                            formatTimeAgo={formatTimeAgo}
                            getActionText={getActionText}
                        />
                    </div>

                    <Link href="/dashboard/settings" className="w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm shrink-0">
                        <HugeiconsIcon icon={Settings01Icon} className="w-[18px] h-[18px] text-gray-800" strokeWidth={1.5} />
                    </Link>
                </div>
            </div>

            {/* --- DESKTOP NAVIGATION --- */}
            <div className="hidden md:flex items-center justify-between w-full">
                {/* Far Left: Logo with Beta Tag */}
                <button onClick={handleLogoClick} className="flex items-center gap-2 relative cursor-pointer transition-transform active:scale-95">
                    <Image src="/logo.svg" alt="HiveZone Logo" width={140} height={40} priority className="h-8 w-auto relative z-10" />
                    <span className="absolute -top-2 -right-10 bg-black text-[#ffc107] text-[10px] font-bold px-2 py-0.5 rounded-[4px] tracking-widest shadow-sm rotate-12">
                        BETA
                    </span>
                </button>

                {/* Center Box */}
                <div className="flex items-center gap-4">
                    {/* Message Icon */}
                    <Link href="/dashboard/chat" className="relative w-11 h-11 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                        <HugeiconsIcon icon={BubbleChatIcon} className="w-6 h-6 outline-none text-gray-800" strokeWidth={1.5} />
                        {chatUnreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#ff3b30] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                                {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                            </span>
                        )}
                    </Link>

                    {/* Overview/Profile Button */}
                    <button className="px-6 py-2 h-11 bg-white border border-gray-300 rounded-full text-[15px] font-medium shadow-sm hover:bg-gray-50 transition-colors capitalize">
                        {getPageName()}
                    </button>

                    {/* Search Bar */}
                    <div className="relative flex items-center w-72 lg:w-96">
                        <input
                            type="text"
                            placeholder={pathname === '/dashboard/gigs' ? "search gigs..." : "search your hive"}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            className="w-full h-11 pl-5 pr-12 bg-white border border-gray-300 rounded-full text-sm outline-none shadow-sm placeholder:text-gray-400 font-medium focus:border-[#ffc107] transition-colors"
                        />
                        <HugeiconsIcon
                            icon={Search01Icon}
                            className="w-5 h-5 text-gray-500 absolute right-4 cursor-pointer hover:text-[#ffc107] transition-colors"
                            strokeWidth={1.5}
                            onClick={triggerSearch}
                        />
                    </div>

                    {/* Admin Button */}
                    {profile?.is_admin && (
                        <Link href="/admin" className="px-5 py-2 h-11 bg-black text-[#ffc107] rounded-full text-[15px] font-bold shadow-sm hover:bg-gray-900 transition-colors flex items-center justify-center shrink-0">
                            Admin
                        </Link>
                    )}
                </div>

                {/* Right Box */}
                <div className="flex items-center gap-4">

                    {/* Notification Widget Container */}
                    <div className="relative" ref={notifRef}>
                        <div
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                            className={`relative w-11 h-11 bg-white border ${isNotifOpen ? 'border-black' : 'border-gray-300'} rounded-full flex items-center justify-center shadow-sm cursor-pointer hover:bg-gray-50 transition-colors z-10`}
                        >
                            <HugeiconsIcon icon={Notification01Icon} className="w-[22px] h-[22px]" strokeWidth={1.5} />
                            {notificationUnreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#ff3b30] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                                    {notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}
                                </span>
                            )}
                        </div>

                        <NotificationDrawer
                            isOpen={isNotifOpen}
                            onClose={() => setIsNotifOpen(false)}
                            notifications={notifications}
                            unreadCount={notificationUnreadCount}
                            markAsRead={markAsRead}
                            markAllAsRead={markAllAsRead}
                            deleteNotification={deleteNotification}
                            clearAllNotifications={clearAllNotifications}
                            formatTimeAgo={formatTimeAgo}
                            getActionText={getActionText}
                        />
                    </div>

                    {/* Settings Link */}
                    <Link href="/dashboard/settings" className="w-11 h-11 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
                        <HugeiconsIcon icon={Settings01Icon} className="w-[22px] h-[22px] text-gray-800" strokeWidth={1.5} />
                    </Link>

                    {/* Profile Widget Container */}
                    <div className="relative" ref={dropdownRef}>
                        {/* Profile Trigger */}
                        <div
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center bg-[#ffc107] p-1 rounded-full cursor-pointer hover:bg-[#ffca2c] transition-colors ml-2 shadow-sm"
                        >
                            {/* Profile Avatar */}
                            <Avatar src={profile?.profile_picture} name={getDisplayName(profile, "User")} className="w-9 h-9 rounded-full" />

                            <div className="w-3"></div> {/* Spacing */}

                            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
                                <HugeiconsIcon icon={ArrowDown01Icon} className={`w-5 h-5 text-zinc-900 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
                            </div>
                        </div>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-300 py-2 z-50 overflow-hidden">
                                <Link
                                    href="/dashboard/profile"
                                    onClick={() => setIsDropdownOpen(false)}
                                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                                >
                                    <HugeiconsIcon icon={UserIcon} className="w-4 h-4" strokeWidth={1.5} />
                                    Profile
                                </Link>
                                <div className="h-px bg-gray-300 my-1"></div>
                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center gap-2 text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <HugeiconsIcon icon={LogoutCircle02Icon} className="w-4 h-4" strokeWidth={1.5} />
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* --- MOBILE SIDEBAR OVERLAY --- */}
            {isMobileSidebarOpen && (
                <div className="md:hidden fixed inset-0 z-[9999] flex">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileSidebarOpen(false)}></div>

                    {/* Sidebar Panel */}
                    <div className="relative w-[280px] max-w-[80vw] h-full bg-white shadow-2xl flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex flex-col gap-3 bg-[#fcf6de]/30">
                            <Avatar src={profile?.profile_picture} name={getDisplayName(profile, "User")} className="w-14 h-14 rounded-full border-2 border-white shadow-sm" />
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-900 text-lg">
                                    {getDisplayName(profile, "User")}
                                </span>
                                <span className="text-gray-500 font-medium text-[13px]">
                                    {profile?.username ? `@${profile.username} ` : ""}
                                </span>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="flex-1 overflow-y-auto min-h-0 py-4 flex flex-col gap-1 px-3">
                            <Link href="/dashboard/profile" onClick={() => setIsMobileSidebarOpen(false)} className="px-4 py-3.5 rounded-2xl hover:bg-gray-50 flex items-center gap-4 transition-colors">
                                <HugeiconsIcon icon={UserIcon} className="w-[22px] h-[22px] text-gray-600" />
                                <span className="font-bold text-gray-900 text-[16px]">Profile</span>
                            </Link>

                            <div className="h-px bg-gray-100 my-2 mx-2"></div>

                            {profile?.is_admin && (
                                <>
                                    <Link href="/admin" onClick={() => setIsMobileSidebarOpen(false)} className="px-4 py-3.5 rounded-2xl hover:bg-gray-50 flex items-center gap-4 transition-colors">
                                        <HugeiconsIcon icon={Settings01Icon} className="w-[22px] h-[22px] text-gray-600" />
                                        <span className="font-bold text-gray-900 text-[16px]">Admin Panel</span>
                                    </Link>
                                    <div className="h-px bg-gray-100 my-2 mx-2"></div>
                                </>
                            )}
                        </div>

                        {/* Footer (Logout) */}
                        <div className="p-4 pb-24 pb-safe border-t border-gray-100">
                            <button onClick={handleSignOut} className="w-full px-4 py-3.5 rounded-2xl hover:bg-red-50 flex items-center gap-4 text-red-600 transition-colors">
                                <HugeiconsIcon icon={LogoutCircle02Icon} className="w-[22px] h-[22px]" />
                                <span className="font-bold text-[16px]">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
