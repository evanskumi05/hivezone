"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    UserGroupIcon,
    Briefcase02Icon,
    Mortarboard01Icon,
    Alert01Icon,
    ArrowRight01Icon
} from "@hugeicons/core-free-icons";

export default function AdminDashboard() {
    const stats = [
        { label: "Total Users", value: "10,547", icon: UserGroupIcon, color: "text-[#ffc107]" },
        { label: "Active Internships", value: "99", icon: Briefcase02Icon, color: "text-pink-500" },
        { label: "Scholarships", value: "150", icon: Mortarboard01Icon, color: "text-blue-500" },
        { label: "Unresolved Reports", value: "4", icon: Alert01Icon, color: "text-red-500" },
    ];

    const recentActivities = [
        { date: "2 mins ago", user: "John Doe", activity: "reported a gig for spam", status: "UNDER REVIEW", statusColor: "text-red-500", avatarColor: "border-[#ffc107] text-gray-900", initial: "J" },
        { date: "2 mins ago", user: "Sarah Willey", activity: "applied for Paystack Internships", status: "PROCESSED", statusColor: "text-blue-600", avatarColor: "border-green-500 text-gray-900", initial: "S" },
        { date: "2 mins ago", user: "Netskiper", activity: "reported a feed to be harassment", status: "UNDER REVIEW", statusColor: "text-red-500", avatarColor: "border-red-500 text-gray-900", initial: "n" },
        { date: "2 mins ago", user: "Admin", activity: "added MTN Scholarship 2026", status: "COMPLETED", statusColor: "text-gray-900", avatarColor: "border-pink-500 text-gray-900", initial: "A" },
    ];

    return (
        <div className="space-y-8 flex flex-col h-full min-h-0 pb-0">
            {/* Stats Grid */}
            <div className="bg-white rounded-[2rem] p-8 shrink-0 shadow-sm border border-gray-100">
                <div className="grid grid-cols-4 gap-8">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="flex flex-col items-center justify-center text-center">
                            <div className={`mb-3 flex items-center justify-center`}>
                                <HugeiconsIcon icon={stat.icon} className={`w-8 h-8 ${stat.color} stroke-[1.5]`} />
                            </div>
                            <p className="text-gray-500 font-bold text-xs mb-2">{stat.label}</p>
                            <h3 className="text-4xl font-extrabold font-newyork text-gray-900 tracking-tight">{stat.value}</h3>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Activity Card */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col flex-1 shrink-0 min-h-[400px]">
                <div className="px-10 py-8 flex items-center justify-between shrink-0">
                    <h3 className="text-xl font-extrabold font-newyork text-gray-900">Recent Activity</h3>
                    <button className="text-[#ffc107] font-bold text-sm flex items-center gap-1.5 group">
                        View all <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="px-10 pb-10 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                    {recentActivities.map((activity, idx) => (
                        <div key={idx} className="flex items-center justify-between group">
                            <div className="flex items-center gap-5">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 ${activity.avatarColor}`}>
                                    {activity.initial}
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm">
                                        <span className="text-gray-900 font-extrabold">{activity.user}</span>
                                        <span className="text-gray-500 font-medium ml-1.5">{activity.activity}</span>
                                    </p>
                                    <span className="text-xs text-gray-400 font-medium mt-1">{activity.date}</span>
                                </div>
                            </div>

                            <div className="flex items-center shrink-0 ml-4">
                                <span className={`text-[10px] sm:text-xs font-black tracking-widest uppercase ${activity.statusColor}`}>
                                    {activity.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
