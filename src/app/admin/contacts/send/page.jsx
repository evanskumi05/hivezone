"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    SentIcon,
    UserCircleIcon,
    InformationCircleIcon,
    Loading03Icon,
    NoteIcon,
} from "@hugeicons/core-free-icons";
import { useUI } from "@/components/ui/UIProvider";
import { createClient } from "@/utils/supabase/client";

const SMS_CHAR_LIMIT = 160;

function SMSComposer() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const phoneFromUrl = searchParams.get("phone") || "";
    const nameFromUrl = searchParams.get("name") || "User";
    const { showToast } = useUI();

    const [recipient, setRecipient] = useState(phoneFromUrl);
    const [message, setMessage] = useState("");
    const [sendToAll, setSendToAll] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const { data, error } = await supabase.from('sms_templates').select('*').order('name');
            if (error) throw error;
            setTemplates(data || []);
        } catch (error) {
            console.error("Error fetching templates:", error);
        } finally {
            setLoadingTemplates(false);
        }
    };

    // Sync state if URL param changes (e.g. clicking different contact)
    useEffect(() => {
        if (phoneFromUrl) setRecipient(phoneFromUrl);
    }, [phoneFromUrl]);

    // Calculate SMS units (1 unit = 160 chars)
    const charCount = message.length;
    const units = Math.ceil(charCount / SMS_CHAR_LIMIT) || 0;

    const applyTemplate = (content) => {
        const personalized = content.replace(/{{name}}/g, nameFromUrl);
        setMessage(personalized);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if ((!recipient && !sendToAll) || !message) {
            showToast("Please fill in both recipient and message", "error");
            return;
        }

        const confirmMessage = sendToAll 
            ? "Are you sure you want to send this SMS to ALL users? This action cannot be undone."
            : `Send this SMS to ${recipient}?`;

        if (!window.confirm(confirmMessage)) return;

        setIsSending(true);
        try {
            const response = await fetch("/api/admin/sms/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipients: sendToAll ? null : recipient,
                    message: message,
                    sendToAll: sendToAll,
                    name: nameFromUrl
                })
            });

            const result = await response.json();

            if (result.success) {
                showToast(`SMS sent successfully ${sendToAll ? `to ${result.count} users` : ''}!`, "success");
                setMessage("");
                if (!sendToAll) setRecipient("");
            } else {
                showToast(result.error || "Failed to send SMS", "error");
            }
        } catch (error) {
            showToast("An error occurred while sending.", "error");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto py-6 scrollbar-hide px-4">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-[#ffc107] p-6 text-black">
                    <h1 className="text-2xl font-black font-newyork flex items-center gap-3">
                        <HugeiconsIcon icon={SentIcon} className="w-6 h-6" />
                        Send SMS
                    </h1>
                </div>

                <form onSubmit={handleSend} className="p-6 space-y-5">
                    {/* Templates Selector */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <HugeiconsIcon icon={NoteIcon} className="w-3.5 h-3.5" />
                            Quick Templates
                        </label>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {loadingTemplates ? (
                                [1, 2, 3].map(i => <div key={i} className="h-8 w-24 bg-gray-50 rounded-lg animate-pulse shrink-0" />)
                            ) : templates.map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => applyTemplate(t.content)}
                                    className={`px-4 py-2 rounded-lg border-2 font-bold text-[10px] whitespace-nowrap transition-all
                                        ${message === t.content.replace(/{{name}}/g, nameFromUrl) ? 'bg-[#ffc107] border-[#ffc107] text-black shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-[#ffc107] hover:text-gray-900'}
                                    `}
                                >
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recipient */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <HugeiconsIcon icon={UserCircleIcon} className="w-3.5 h-3.5" />
                                Recipient Number
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${sendToAll ? 'text-[#ffc107]' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                    Send to All Users
                                </span>
                                <div 
                                    onClick={() => setSendToAll(!sendToAll)}
                                    className={`w-8 h-4 rounded-full p-0.5 transition-all duration-300 ${sendToAll ? 'bg-[#ffc107]' : 'bg-gray-200'}`}
                                >
                                    <div className={`w-3 h-3 bg-white rounded-full transition-all duration-300 ${sendToAll ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                            </label>
                        </div>
                        
                        {!sendToAll ? (
                            <input
                                type="text"
                                placeholder="+233..."
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#ffc107]/50 transition-all placeholder:text-gray-300"
                            />
                        ) : (
                            <div className="w-full bg-[#ffc107]/5 border-2 border-dashed border-[#ffc107]/30 rounded-xl px-4 py-3 text-sm font-bold text-[#ffc107] flex items-center gap-2 italic">
                                <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4" />
                                Sending to all registered users
                            </div>
                        )}
                    </div>

                    {/* Message Body */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Message</label>
                            <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded ${units > 1 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                    {units} Unit{units !== 1 ? 's' : ''}
                                </span>
                                <span className="text-[9px] font-black text-gray-300 tracking-widest uppercase">
                                    {charCount} Chars
                                </span>
                            </div>
                        </div>
                        <textarea
                            rows={4}
                            placeholder="Write your message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#ffc107]/50 transition-all placeholder:text-gray-300 resize-none font-sans"
                        />
                    </div>

                    {/* Notice */}
                    <div className="bg-blue-50/50 p-3 rounded-xl flex items-start gap-2">
                        <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-blue-600 leading-tight uppercase tracking-tight">
                            Starts with country code (e.g. +233).
                        </p>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSending}
                        className="w-full bg-black text-white rounded-full py-4 font-black text-base flex items-center justify-center gap-3 hover:bg-[#ffc107] hover:text-black transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
                    >
                        {isSending ? (
                            <>
                                <HugeiconsIcon icon={Loading03Icon} className="w-5 h-5 animate-spin" />
                                <span>Sending...</span>
                            </>
                        ) : (
                            <>
                                <HugeiconsIcon icon={SentIcon} className="w-5 h-5" />
                                <span>Step into the Network</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function SendSMSPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-20">
                <HugeiconsIcon icon={Loading03Icon} className="w-10 h-10 animate-spin text-[#ffc107]" />
            </div>
        }>
            <SMSComposer />
        </Suspense>
    );
}
