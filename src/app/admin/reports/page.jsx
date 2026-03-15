"use client";

import React, { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Alert01Icon,
    Delete02Icon,
    CheckListIcon,
    Search01Icon,
    MoreHorizontalIcon,
    ViewIcon,
    Megaphone03Icon,
    Loading03Icon,
    MessageMultiple01Icon,
    UserIcon,
    Flag01Icon,
    Tick02Icon
} from "@hugeicons/core-free-icons";
import { createClient } from "@/utils/supabase/client";
import { useUI } from "@/components/ui/UIProvider";

export default function ReportsManagement() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const { showToast, confirmAction } = useUI();

    const fetchReports = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reports')
                .select(`
                    *,
                    reporter:users!reporter_id (
                        display_name,
                        first_name
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReports(data || []);
        } catch (error) {
            showToast("Failed to load reports.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleStatusUpdate = async (reportId, newStatus) => {
        try {
            const { error } = await supabase
                .from('reports')
                .update({ status: newStatus })
                .eq('id', reportId);

            if (error) throw error;

            setReports(reports.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
            showToast(`Report marked as ${newStatus}.`);
        } catch (error) {
            showToast("Failed to update status.", "error");
        }
    };

    const handleDismissReport = async (reportId) => {
        const confirmed = await confirmAction({
            title: "Dismiss Report?",
            message: "This will mark the report as dismissed without taking further action.",
            confirmText: "Dismiss",
            type: "warning"
        });

        if (confirmed) {
            handleStatusUpdate(reportId, 'dismissed');
        }
    };

    const handleResolveReport = async (report) => {
        const confirmed = await confirmAction({
            title: "Resolve Report?",
            message: "This will mark the report as resolved without deleting any content. Use this after you have reviewed the issue.",
            confirmText: "Resolve Now",
            type: "warning"
        });

        if (confirmed) {
            handleStatusUpdate(report.id, 'resolved');
        }
    };

    return (
        <div className="space-y-6 flex flex-col h-full min-h-0 pb-4">
            {/* Page Header Card */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-row items-center gap-6 shrink-0">
                <div className="w-16 h-16 rounded-full border border-red-500 flex items-center justify-center shrink-0">
                    <span className="text-red-500 text-2xl font-light">!</span>
                </div>
                <div className="text-left">
                    <h1 className="text-2xl font-newyork font-extrabold text-gray-900 mb-2">Safety Reports</h1>
                    <p className="text-red-500 font-medium text-sm">Review and take action on reported content to maintain campus safety.</p>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col flex-1 shrink-0">
                {loading ? (
                    <div className="flex flex-col items-center justify-center min-h-[500px] text-gray-300 gap-4">
                        <HugeiconsIcon icon={Loading03Icon} className="w-12 h-12 animate-spin" />
                        <p className="font-black text-[10px] uppercase tracking-widest">Gathering reports...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[500px] text-gray-300 gap-6">
                        <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center">
                            <HugeiconsIcon icon={CheckListIcon} className="w-10 h-10" />
                        </div>
                        <p className="text-xl font-black font-newyork">No reports to review!</p>
                    </div>
                ) : (
                    <div className="overflow-y-auto overflow-x-auto flex-1 scrollbar-hide">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                                <tr>
                                    <th className="px-6 py-5 text-gray-400 font-bold text-[11px] uppercase tracking-wider bg-white whitespace-nowrap">Reported</th>
                                    <th className="px-6 py-5 text-gray-400 font-bold text-[11px] uppercase tracking-wider bg-white whitespace-nowrap">Reason</th>
                                    <th className="px-6 py-5 text-gray-400 font-bold text-[11px] uppercase tracking-wider bg-white whitespace-nowrap">Reporter</th>
                                    <th className="px-6 py-5 text-gray-400 font-bold text-[11px] uppercase tracking-wider bg-white whitespace-nowrap">Status</th>
                                    <th className="px-6 py-5 text-gray-400 font-bold text-[11px] uppercase tracking-wider bg-white whitespace-nowrap text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {reports.map((report) => (
                                    <tr key={report.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                                    <HugeiconsIcon icon={
                                                        report.item_type === 'gig' ? Megaphone03Icon :
                                                            report.item_type === 'conversation' ? MessageMultiple01Icon :
                                                                report.item_type === 'user' ? UserIcon :
                                                                    Flag01Icon
                                                    } className="w-4 h-4 text-gray-400" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[13px] font-bold text-gray-900 truncate uppercase tracking-tight">
                                                        {report.item_type === 'gig' ? 'Gig' :
                                                            report.item_type === 'conversation' ? 'Chat' :
                                                                report.item_type === 'user' ? 'User' :
                                                                    'Post'}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400 mt-0.5">#{report.item_id.substring(0, 6).toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col max-w-[140px]">
                                                <span className="text-[13px] font-bold text-red-500 leading-tight">
                                                    {report.reason}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-gray-900">{report.reporter?.display_name || report.reporter?.first_name}</span>
                                                <span className="text-[10px] font-bold text-gray-400 mt-0.5">
                                                    {new Date(report.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full border
                                                ${report.status === 'pending' ? 'text-gray-400 border-gray-100 bg-gray-50/50' :
                                                    report.status === 'resolved' ? 'text-green-600 border-green-100 bg-green-50/50' :
                                                        report.status === 'dismissed' ? 'text-gray-300 border-gray-50 bg-gray-50/20' :
                                                            'text-blue-600 border-blue-100 bg-blue-50/50'}
                                            `}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5 shrink-0">
                                                {report.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(report.id, 'reviewed')}
                                                        className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                        title="Reviewed"
                                                    >
                                                        <HugeiconsIcon icon={ViewIcon} className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDismissReport(report.id)}
                                                    className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-all shadow-sm"
                                                    title="Dismiss"
                                                >
                                                    <HugeiconsIcon icon={CheckListIcon} className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleResolveReport(report)}
                                                    className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-sm"
                                                    title="Mark as Resolved"
                                                >
                                                    <HugeiconsIcon icon={Tick02Icon} className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
