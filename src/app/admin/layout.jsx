"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    DashboardCircleIcon,
    Alert01Icon,
    UserCircleIcon,
    LogoutCircle02Icon,
    UserGroupIcon,
    Mail01Icon,
    Search01Icon,
    FilterIcon,
    PlusSignIcon
} from "@hugeicons/core-free-icons";
import { createClient } from "@/utils/supabase/client";

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/auth/signin");
                return;
            }

            const { data: profile } = await supabase
                .from('users')
                .select('display_name, is_admin, profile_picture')
                .eq('id', session.user.id)
                .single();

            if (!profile?.is_admin) {
                router.push("/dashboard");
                return;
            }

            setUser({
                ...session.user,
                display_name: profile.display_name,
                avatar_url: profile.profile_picture
            });
            setIsAdmin(true);
            setIsLoading(false);
        };
        checkUser();
    }, [router, supabase]);

    const navItems = [
        { label: "Overview", href: "/admin", icon: DashboardCircleIcon },
        { label: "Reports", href: "/admin/reports", icon: Alert01Icon },
        { label: "Contacts", href: "/admin/contacts", icon: Mail01Icon },
    ];

    const quickActions = [
        { label: "User Manager", href: "/admin/users", icon: UserGroupIcon },
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#f1efe6]">
                <div className="w-10 h-10 border-4 border-[#ffc107]/30 border-t-[#ffc107] rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="flex flex-col h-screen bg-[#f3ebd6] text-zinc-900 font-sans selection:bg-[#ffc107]/30 overflow-auto p-10 min-w-[1240px]">
            {/* Header */}
            <header className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-14">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center">
                        <Image src="/logo.svg" alt="HiveZone" width={140} height={40} className="h-9 w-auto" priority />
                    </Link>

                    {/* Active Page Indicator */}
                    <div className="flex items-center justify-center px-8 py-2.5 bg-white text-gray-900 rounded-full font-extrabold text-sm shadow-sm transition-all">
                        {[...navItems, ...quickActions].find(i => i.href === pathname)?.label || "Overview"}
                    </div>

                    {/* Search Bar - only on reports */}
                    {pathname === "/admin/reports" && (
                        <div className="flex items-center gap-3 bg-white px-6 py-2.5 rounded-full w-[400px] shadow-sm">
                            <input
                                type="text"
                                placeholder="search reports"
                                className="bg-transparent border-none outline-none text-sm font-medium w-full placeholder:text-gray-400"
                            />
                            <HugeiconsIcon icon={Search01Icon} className="w-4 h-4 text-gray-400" />
                        </div>
                    )}
                </div>

                {/* Header Right */}
                <div className="flex items-center gap-10">
                    {/* Page Actions (Conditional) */}
                    {pathname === "/admin/users" && (
                        <div className="flex items-center gap-4">
                            <button className="flex items-center gap-2 px-6 py-2.5 bg-white rounded-full font-bold text-sm shadow-sm border border-gray-100 hover:bg-gray-50 transition-all">
                                <HugeiconsIcon icon={FilterIcon} className="w-4 h-4 text-gray-600" />
                                <span>Filter</span>
                            </button>
                            <button className="flex items-center gap-2 px-6 py-2.5 bg-white rounded-full font-bold text-sm shadow-sm border border-gray-100 hover:bg-gray-50 transition-all">
                                <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4 text-gray-600" />
                                <span>New User</span>
                            </button>
                        </div>
                    )}

                    {/* User Profile */}
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-extrabold text-gray-900 leading-tight">
                                {user?.display_name || user?.email?.split('@')[0]}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">ADMINISTRATOR</span>
                        </div>
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#a3443a] shadow-sm bg-gray-100 flex items-center justify-center shrink-0">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt="Admin" className="w-full h-full object-cover" />
                            ) : (
                                <HugeiconsIcon icon={UserCircleIcon} className="w-8 h-8 text-gray-300" />
                            )}
                        </div>
                    </div>
                </div>
            </header>


            {/* Main Area (Sidebar + Content) */}
            <div className="flex flex-1 gap-8 overflow-hidden h-full">
                {/* Sidebar */}
                <aside className={`
                    relative w-64 bg-white z-50 rounded-[2rem] flex flex-col py-8 px-6 overflow-y-auto scrollbar-hide shrink-0
                `}>

                    {/* Main Nav */}
                    <nav className="w-full space-y-5 mb-14 mt-4">
                        {navItems.map((item) => {
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                                        flex items-center gap-3 px-6 py-3 rounded-full font-bold text-sm transition-all border border-[#ffc107]
                                        ${pathname === item.href ? 'bg-[#ffc107] text-gray-900' : 'bg-white text-gray-900 hover:bg-yellow-50'}
                                    `}
                                >
                                    <HugeiconsIcon icon={item.icon} className={`w-5 h-5 ${pathname === item.href ? 'text-gray-900' : 'text-gray-600'}`} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Quick Actions */}
                    <div className="w-full flex-1">
                        <h3 className="text-xl font-extrabold text-gray-900 text-center lg:text-left mb-6 px-2 align-middle">
                            <span className="leading-tight font-newyork pb-1">Quick Actions</span>
                        </h3>
                        <div className="space-y-4">
                            {quickActions.map((action, idx) => (
                                <Link
                                    key={idx}
                                    href={action.href}
                                    className={`
                                        w-full flex items-center justify-start gap-3 px-6 py-3 rounded-full border border-[#ffc107] font-bold text-sm transition-all
                                        ${pathname === action.href ? 'bg-[#ffc107] text-gray-900' : 'bg-white text-gray-900 hover:bg-yellow-50'}
                                    `}
                                >
                                    <HugeiconsIcon icon={action.icon} className={`w-4 h-4 ${pathname === action.href ? 'text-gray-900' : 'text-gray-600'}`} />
                                    <span>{action.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Footer / Step Out */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-start gap-2 px-6 py-4 text-red-500 font-medium text-sm hover:bg-red-50 rounded-full transition-all mt-8"
                    >
                        <HugeiconsIcon icon={LogoutCircle02Icon} className="w-5 h-5" />
                        <span>Step Out</span>
                    </button>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0 overflow-y-auto scrollbar-hide h-full pr-4">
                    {children}
                </main>
            </div>
        </div>
    );
}
