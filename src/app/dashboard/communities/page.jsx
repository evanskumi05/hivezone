"use client";

import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    UserGroupIcon,
    ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import MainFeed from "@/components/dashboard/MainFeed";
import Sidebar from "@/components/dashboard/Sidebar";

const CommunityCard = ({ title, description, icon, href, isComingSoon = false, color = "bg-[#ffc107]" }) => (
    <Link 
        href={isComingSoon ? "#" : href}
        className={`group relative flex flex-col p-6 rounded-[2rem] border border-gray-100 bg-white hover:border-[#ffc107] transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(255,193,7,0.12)] h-full overflow-hidden ${isComingSoon ? 'cursor-default' : 'cursor-pointer'}`}
    >
        {/* Abstract Background Decoration */}
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${color}`}></div>
        
        <div className="flex items-center justify-between mb-4">
            <div className={`p-4 rounded-2xl ${color} text-white shadow-sm`}>
                <HugeiconsIcon icon={icon} className="w-6 h-6" strokeWidth={2} />
            </div>
            {isComingSoon ? (
                <span className="text-[10px] font-black uppercase tracking-widest text-[#ffc107] bg-[#ffc107]/10 px-3 py-1 rounded-full">Coming Soon</span>
            ) : (
                <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-[#ffc107] group-hover:border-[#ffc107] group-hover:text-white transition-all duration-300">
                    <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
                </div>
            )}
        </div>
        
        <h3 className="text-xl font-black text-gray-900 mb-2 font-newyork">{title}</h3>
        <p className="text-sm font-medium text-gray-500 leading-relaxed mb-4">{description}</p>
        
        {!isComingSoon && (
            <div className="mt-auto flex items-center gap-2 text-xs font-bold text-gray-400 group-hover:text-[#ffc107] transition-colors">
                <span>Enter Community</span>
            </div>
        )}
    </Link>
);

export default function CommunitiesPage() {
    return (
        <div className="flex h-full bg-[#fcf6de] p-4 sm:p-6 lg:p-8 pt-0 gap-8 max-w-[1400px] mx-auto w-full overflow-hidden">
            {/* Left Sidebar (Desktop Only) */}
            <div className="shrink-0 flex-col hidden lg:flex h-full pt-4">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 h-full overflow-y-auto no-scrollbar pt-4 pb-20 md:pb-8">
                <header className="mb-10">
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 font-newyork tracking-tight">Communities</h1>
                    <p className="text-lg font-medium text-gray-600 max-w-2xl">Connect with your peers, share knowledge, and thrive together in specialized circles.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Active Features */}
                    <CommunityCard 
                        title="Study Circles"
                        description="Collaborate with classmates, share resources, and master your courses together in real-time."
                        icon={UserGroupIcon}
                        href="/dashboard/study-circles"
                        color="bg-blue-600"
                    />
                </div>
            </div>
        </div>
    );
}


