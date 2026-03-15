"use client";

import React, { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Mail01Icon,
    Tick02Icon,
    Delete02Icon,
    Copy01Icon
} from "@hugeicons/core-free-icons";
import { createClient } from "@/utils/supabase/client";
import { useUI } from "@/components/ui/UIProvider";

export default function AdminContactsPage() {
    const [contacts, setContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();
    const { showToast, confirmAction } = useUI();

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setContacts(data || []);
        } catch (error) {
            console.error("Fetch contacts error:", error);
            showToast("Failed to load contacts.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (contactId, newStatus) => {
        try {
            const { error } = await supabase
                .from('contacts')
                .update({ status: newStatus })
                .eq('id', contactId);

            if (error) throw error;

            setContacts(prev => prev.map(c => 
                c.id === contactId ? { ...c, status: newStatus } : c
            ));
            showToast(`Contact marked as ${newStatus}`);
        } catch (error) {
            showToast("Failed to update status", "error");
        }
    };

    const handleDeleteContact = async (contactId) => {
        const confirmed = await confirmAction({
            title: "Delete Contact Entry?",
            message: "This will permanently remove this contact message from the database.",
            confirmText: "Delete Entry",
            type: "danger"
        });

        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from('contacts')
                .delete()
                .eq('id', contactId);

            if (error) throw error;

            setContacts(prev => prev.filter(c => c.id !== contactId));
            showToast("Contact entry deleted.");
        } catch (error) {
            showToast("Failed to delete contact.", "error");
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex flex-col min-h-0">
                <div className="bg-white rounded-[2.5rem] flex-1 flex flex-col overflow-hidden shadow-sm border border-gray-100 min-h-0">
                    <div className="overflow-x-auto flex-1 scrollbar-hide">
                        <table className="w-full text-left">
                            <thead className="bg-white border-b border-gray-50">
                                <tr>
                                    {["Sender", "Subject", "Message", "Status", ""].map((h, i) => (
                                        <th key={i} className="px-6 py-5 text-gray-400 font-bold text-[11px] uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {[...Array(6)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col gap-2">
                                                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                                                <div className="h-2 w-32 bg-gray-50 rounded animate-pulse" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="h-5 w-20 bg-gray-100 rounded-lg animate-pulse" />
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col gap-2">
                                                <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
                                                <div className="h-2 w-16 bg-gray-50 rounded animate-pulse" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="h-5 w-16 bg-gray-50 rounded-full animate-pulse" />
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex justify-end gap-2">
                                                <div className="w-8 h-8 bg-gray-50 rounded-full animate-pulse" />
                                                <div className="w-8 h-8 bg-gray-50 rounded-full animate-pulse" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col min-h-0">
            {/* Contacts Table Card */}
            <div className="bg-white rounded-[2.5rem] flex-1 flex flex-col overflow-hidden shadow-sm border border-gray-100 min-h-0">
                {contacts.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <HugeiconsIcon icon={Mail01Icon} className="w-10 h-10 text-gray-200" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2 font-newyork">No contact messages</h3>
                        <p className="text-gray-400 font-medium max-w-sm">When users send messages via the contact page, they will appear here.</p>
                    </div>
                ) : (
                    <div className="overflow-y-auto overflow-x-auto flex-1 scrollbar-hide">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                                <tr>
                                    <th className="px-6 py-5 text-gray-400 font-bold text-[11px] uppercase tracking-wider bg-white whitespace-nowrap">Sender</th>
                                    <th className="px-6 py-5 text-gray-400 font-bold text-[11px] uppercase tracking-wider bg-white whitespace-nowrap">Subject</th>
                                    <th className="px-6 py-5 text-gray-400 font-bold text-[11px] uppercase tracking-wider bg-white whitespace-nowrap">Message</th>
                                    <th className="px-6 py-5 text-gray-400 font-bold text-[11px] uppercase tracking-wider bg-white whitespace-nowrap">Status</th>
                                    <th className="px-6 py-5 text-gray-400 font-bold text-[11px] uppercase tracking-wider bg-white whitespace-nowrap text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {contacts.map((contact) => (
                                    <tr key={contact.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-gray-900 truncate uppercase tracking-tight">
                                                    {contact.full_name}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 mt-0.5">{contact.email}</span>
                                                {contact.phone_number && (
                                                    <div className="flex items-center gap-2 group/phone mt-0.5">
                                                        <span className="text-[10px] font-bold text-[#a3443a]">{contact.phone_number}</span>
                                                        <button 
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(contact.phone_number);
                                                                showToast("Phone number copied!");
                                                            }}
                                                            className="opacity-0 group-hover/phone:opacity-100 transition-opacity p-0.5 hover:bg-red-50 rounded text-[#a3443a]"
                                                            title="Copy number"
                                                        >
                                                            <HugeiconsIcon icon={Copy01Icon} className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[12px] font-extrabold text-[#a3443a] bg-[#a3443a]/5 px-2.5 py-1 rounded-lg uppercase tracking-tight">
                                                {contact.subject || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-[300px]">
                                                <p className="text-[13px] font-bold text-gray-600 line-clamp-2 leading-relaxed" title={contact.message}>
                                                    {contact.message}
                                                </p>
                                                <span className="text-[10px] font-bold text-gray-300 mt-1 block">
                                                    {new Date(contact.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full border
                                                ${contact.status === 'pending' ? 'text-gray-400 border-gray-100 bg-gray-50/50' :
                                                    contact.status === 'read' ? 'text-blue-600 border-blue-100 bg-blue-50/50' :
                                                    contact.status === 'resolved' ? 'text-green-600 border-green-100 bg-green-50/50' :
                                                    'text-gray-300 border-gray-50 bg-gray-50/20'}
                                            `}>
                                                {contact.status || 'pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5 shrink-0">
                                                {contact.status !== 'resolved' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(contact.id, contact.status === 'pending' ? 'read' : 'resolved')}
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm
                                                            ${contact.status === 'pending' ? 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white' : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'}
                                                        `}
                                                        title={contact.status === 'pending' ? "Mark as Read" : "Mark as Resolved"}
                                                    >
                                                        <HugeiconsIcon icon={Tick02Icon} className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteContact(contact.id)}
                                                    className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                    title="Delete Entry"
                                                >
                                                    <HugeiconsIcon icon={Delete02Icon} className="w-3.5 h-3.5" />
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
