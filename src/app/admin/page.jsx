"use client";

import React, { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    UserGroupIcon,
    Alert01Icon,
    ArrowRight01Icon,
    Mail01Icon,
} from "@hugeicons/core-free-icons";
import { createClient } from "@/utils/supabase/client";

export default function AdminDashboard() {
    const supabase = createClient();
    const [counts, setCounts] = useState({ users: 0, contacts: 0, reports: 0 });
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch exact counts
                const [
                    { count: userCount },
                    { count: contactCount },
                    { count: reportCount },
                    { data: latestUsers },
                    { data: latestReports },
                    { data: latestContacts }
                ] = await Promise.all([
                    supabase.from('users').select('*', { count: 'exact', head: true }),
                    supabase.from('contacts').select('*', { count: 'exact', head: true }),
                    supabase.from('reports').select('*', { count: 'exact', head: true }),
                    supabase.from('users').select('id, first_name, display_name, profile_picture, created_at').order('created_at', { ascending: false }).limit(5),
                    supabase.from('reports').select('id, reason, created_at, item_type').order('created_at', { ascending: false }).limit(5),
                    supabase.from('contacts').select('id, full_name, subject, created_at').order('created_at', { ascending: false }).limit(5)
                ]);

                setCounts({
                    users: userCount || 0,
                    contacts: contactCount || 0,
                    reports: reportCount || 0
                });

                // 2. Merge and format activities
                const activities = [
                    ...(latestUsers || []).map(u => ({
                        id: `user-${u.id}`,
                        user: u.display_name || u.first_name,
                        activity: "joined the hive",
                        date: new Date(u.created_at),
                        status: "NEW MEMBER",
                        statusColor: "text-green-500",
                        avatar: u.profile_picture,
                        initial: (u.display_name || u.first_name)?.[0] || "?"
                    })),
                    ...(latestReports || []).map(r => ({
                        id: `report-${r.id}`,
                        user: "System",
                        activity: `received a ${r.item_type} report: ${r.reason}`,
                        date: new Date(r.created_at),
                        status: "MODERATION",
                        statusColor: "text-red-500",
                        avatar: null,
                        initial: "!"
                    })),
                    ...(latestContacts || []).map(c => ({
                        id: `contact-${c.id}`,
                        user: c.full_name.split(' ')[0],
                        activity: `sent a message: ${c.subject}`,
                        date: new Date(c.created_at),
                        status: "INQUIRY",
                        statusColor: "text-blue-500",
                        avatar: null,
                        initial: "C"
                    }))
                ];

                // Sort by date descending
                setRecentActivities(activities.sort((a, b) => b.date - a.date).slice(0, 10));

            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return "Just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    };

    const stats = [
        { label: "Total Users", value: loading ? "..." : counts.users.toLocaleString(), icon: UserGroupIcon, color: "text-[#ffc107]" },
        { label: "Total Contacts", value: loading ? "..." : counts.contacts.toLocaleString(), icon: Mail01Icon, color: "text-blue-500" },
        { label: "Total Reports", value: loading ? "..." : counts.reports.toLocaleString(), icon: Alert01Icon, color: "text-red-500" },
    ];

    return (
        <div className="space-y-6 flex flex-col h-full min-h-0 pb-0">
            {/* Stats Grid */}
            <div className="bg-white rounded-[2rem] p-8 shrink-0 shadow-sm border border-gray-100">
                <div className="grid grid-cols-3 gap-8">
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
                    <h3 className="text-xl font-extrabold font-newyork text-gray-900">Live Activity Feed</h3>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Live Now</span>
                    </div>
                </div>

                <div className="px-10 pb-10 space-y-6 flex-1 overflow-y-auto scrollbar-hide">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-50">
                            <div className="w-8 h-8 border-2 border-[#ffc107] border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Syncing Data...</p>
                        </div>
                    ) : recentActivities.length === 0 ? (
                        <div className="flex flex-center justify-center p-10 text-gray-300 font-bold italic">No activity yet</div>
                    ) : (
                        recentActivities.map((activity, idx) => (
                            <div key={activity.id} className="flex items-center justify-between group py-1">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 border-gray-100 bg-gray-50 overflow-hidden shrink-0">
                                        {activity.avatar ? (
                                            <img src={activity.avatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-gray-400">{activity.initial}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-sm">
                                            <span className="text-gray-900 font-extrabold">{activity.user}</span>
                                            <span className="text-gray-500 font-medium ml-1.5 line-clamp-1">{activity.activity}</span>
                                        </p>
                                        <span className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tight">{getTimeAgo(activity.date)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center shrink-0 ml-4">
                                    <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 bg-gray-50 rounded-full border border-gray-100 ${activity.statusColor}`}>
                                        {activity.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
