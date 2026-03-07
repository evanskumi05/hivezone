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
    Flag01Icon
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
                        display_name
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

    const handleDeleteContent = async (report) => {
        if (report.item_type === 'user') {
            confirmAction({
                title: "Resolve User Report?",
                message: "This will mark the report as resolved. To ban the user, do so from the Users manager.",
                confirmText: "Resolve",
                type: "warning",
                onConfirm: () => handleStatusUpdate(report.id, 'resolved')
            });
            return;
        }

        const label = report.item_type === 'gig' ? 'Gig' :
            report.item_type === 'conversation' ? 'Conversation' : 'Post';

        const confirmed = await confirmAction({
            title: `Delete Reported ${label}?`,
            message: `This will permanently remove the reported ${report.item_type} and mark the report as resolved.`,
            confirmText: "Delete Content",
            type: "danger"
        });

        if (!confirmed) return;

        try {
            const table = report.item_type === 'gig' ? 'gigs' :
                report.item_type === 'conversation' ? 'conversations' : 'feeds';

            const { error: deleteError } = await supabase
                .from(table)
                .delete()
                .eq('id', report.item_id);

            if (deleteError) throw deleteError;

            await handleStatusUpdate(report.id, 'resolved');
            showToast("Content deleted and report resolved.");
        } catch (error) {
            showToast("Failed to delete content.", "error");
        }
    };

    return (
        <div className="space-y-8 flex flex-col h-full min-h-0 pb-0">
            {/* Page Header Card */}
            <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-gray-100 flex flex-row items-center gap-8 shrink-0">
                <div className="w-16 h-16 rounded-full border border-red-500 flex items-center justify-center shrink-0">
                    <span className="text-red-500 text-2xl font-light">!</span>
                </div>
                <div className="text-left">
                    <h1 className="text-2xl font-newyork font-extrabold text-gray-900 mb-2">Safety Reports</h1>
                    <p className="text-red-500 font-medium text-sm">Review and take action on reported content to maintain campus safety.</p>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col flex-1 shrink-0 min-h-[400px]">
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
                    <div className="overflow-y-auto overflow-x-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                                <tr>
                                    <th className="px-10 py-6 text-gray-500 font-bold text-sm bg-white whitespace-nowrap">Reported Content</th>
                                    <th className="px-10 py-6 text-gray-500 font-bold text-sm bg-white whitespace-nowrap">Reason</th>
                                    <th className="px-10 py-6 text-gray-500 font-bold text-sm bg-white whitespace-nowrap">Reporter</th>
                                    <th className="px-10 py-6 text-gray-500 font-bold text-sm bg-white whitespace-nowrap">Status</th>
                                    <th className="px-10 py-6 text-gray-500 font-bold text-sm bg-white whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {reports.map((report) => (
                                    <tr key={report.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-10 py-5">
                                            <div className="flex items-center gap-4 min-w-[150px]">
                                                <HugeiconsIcon icon={
                                                    report.item_type === 'gig' ? Megaphone03Icon :
                                                        report.item_type === 'conversation' ? MessageMultiple01Icon :
                                                            report.item_type === 'user' ? UserIcon :
                                                                Flag01Icon
                                                } className="w-5 h-5 text-gray-600 shrink-0" />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-extrabold text-gray-900 truncate">
                                                        {report.item_type === 'gig' ? 'Gig Listing' :
                                                            report.item_type === 'conversation' ? 'Conversation' :
                                                                report.item_type === 'user' ? 'User Profile' :
                                                                    'Feed Post'}
                                                    </span>
                                                    <span className="text-xs font-semibold text-gray-400 mt-0.5 whitespace-nowrap">#{report.item_id.substring(0, 8).toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-5">
                                            <div className="flex flex-col min-w-[150px]">
                                                <span className="text-sm font-bold text-red-500 leading-tight">
                                                    {report.reason}
                                                </span>
                                                {report.details && (
                                                    <p className="text-[11px] text-gray-400 font-medium mt-1 max-w-[200px] truncate" title={report.details}>
                                                        {report.details}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-10 py-5">
                                            <div className="flex flex-col min-w-[120px]">
                                                <span className="text-sm font-extrabold text-gray-900 truncate">{report.reporter?.display_name || 'Anonymous'}</span>
                                                <span className="text-[10px] font-medium text-gray-400 mt-0.5">
                                                    {new Date(report.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-5">
                                            <span className={`text-xs font-black tracking-widest uppercase
                                                ${report.status === 'pending' ? 'text-gray-400' :
                                                    report.status === 'resolved' ? 'text-green-600' :
                                                        report.status === 'dismissed' ? 'text-gray-300' :
                                                            'text-blue-600'}
                                            `}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-10 py-5">
                                            <div className="flex items-center gap-2 transition-all shrink-0">
                                                {report.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(report.id, 'reviewed')}
                                                        className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:scale-110 transition-transform"
                                                        title="Mark as Reviewed"
                                                    >
                                                        <HugeiconsIcon icon={ViewIcon} className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDismissReport(report.id)}
                                                    className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:scale-110 transition-transform"
                                                    title="Dismiss Report"
                                                >
                                                    <HugeiconsIcon icon={CheckListIcon} className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteContent(report)}
                                                    className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:scale-110 transition-transform"
                                                    title="Delete Content & Resolve"
                                                >
                                                    <HugeiconsIcon icon={Delete02Icon} className="w-4 h-4" />
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
