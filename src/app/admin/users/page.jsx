"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    FilterIcon,
    PlusSignIcon,
    ArrowLeft01Icon,
    ArrowRight01Icon,
    UserCircleIcon,
    Search01Icon
} from "@hugeicons/core-free-icons";
import Avatar from "@/components/ui/Avatar";
import Link from "next/link";

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const itemsPerPage = 10;
    const supabase = createClient();

    useEffect(() => {
        fetchUsers();
    }, [currentPage, searchTerm]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('users')
                .select('*', { count: 'exact' });

            if (searchTerm) {
                query = query.or(`display_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,student_id.ilike.%${searchTerm}%`);
            }

            const { data, count, error } = await query
                .order('created_at', { ascending: false })
                .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

            if (error) throw error;
            setUsers(data || []);
            setTotalCount(count || 0);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return (
        <div className="h-full flex flex-col min-h-0">
            {/* Users Table Card */}
            <div className="bg-white rounded-[2.5rem] flex-1 flex flex-col overflow-hidden shadow-sm border border-gray-100 min-h-0">
                <div className="overflow-x-auto h-full flex flex-col scrollbar-hide">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white z-10">
                            <tr>
                                <th className="px-8 py-6 text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                                    Users {totalCount > 0 && <span className="ml-1 text-[#ffc107]">({totalCount.toLocaleString()})</span>}
                                </th>
                                <th className="px-6 py-6 text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">U_id</th>
                                <th className="px-6 py-6 text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">Student ID</th>
                                <th className="px-6 py-6 text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">Programme</th>
                                <th className="px-6 py-6 text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">Year</th>
                                <th className="px-8 py-6 text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 text-center">Gender</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 overflow-y-auto">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, idx) => (
                                    <tr key={idx} className="animate-pulse">
                                        <td className="px-8 py-5"><div className="h-10 w-40 bg-gray-100 rounded-full"></div></td>
                                        <td className="px-6 py-5"><div className="h-4 w-32 bg-gray-100 rounded-lg"></div></td>
                                        <td className="px-6 py-5"><div className="h-4 w-20 bg-gray-100 rounded-lg"></div></td>
                                        <td className="px-6 py-5"><div className="h-4 w-40 bg-gray-100 rounded-lg"></div></td>
                                        <td className="px-6 py-5"><div className="h-4 w-16 bg-gray-100 rounded-lg"></div></td>
                                        <td className="px-8 py-5"><div className="h-4 w-8 bg-gray-100 rounded-lg mx-auto"></div></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-8 py-20 text-center text-gray-400 font-medium font-newyork text-xl">
                                        The hive is quiet. No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar 
                                                    src={user.profile_picture} 
                                                    name={user.display_name} 
                                                    className="w-10 h-10 rounded-full border border-gray-100" 
                                                />
                                                <span className="font-bold text-gray-900 text-sm truncate max-w-[150px]">
                                                    {user.display_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[13px] font-bold text-gray-400 font-mono tracking-tight uppercase">
                                                {user.id.slice(0, 18)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[13px] font-bold text-gray-600">
                                                {user.student_id || "—"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[13px] font-bold text-gray-600 truncate max-w-[200px] block">
                                                {user.programme || "—"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[13px] font-bold text-gray-600">
                                                {user.year_of_study || "—"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <span className="text-[13px] font-bold text-gray-600">
                                                {user.gender?.charAt(0) || "—"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-8 py-6 bg-white border-t border-gray-50 flex items-center justify-center gap-4 shrink-0 mt-auto">
                    <div className="flex items-center gap-2">
                        {Array.from({ length: Math.min(totalPages, 9) }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentPage(idx + 1)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${currentPage === idx + 1 ? 'bg-black text-white' : 'text-gray-400 hover:bg-gray-100'}`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>

                    <div className="ml-4 flex items-center gap-2 border border-gray-200 rounded-full px-4 py-1.5 shadow-sm">
                        <span className="text-sm font-bold text-gray-900">10</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}
