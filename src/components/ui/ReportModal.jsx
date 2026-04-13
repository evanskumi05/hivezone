"use client";

import React, { useState } from 'react';
import { createClient } from "@/utils/supabase/client";
import CustomDropdown from "@/components/CustomDropdown";

const REPORT_REASONS = [
    "Spam",
    "Harassment",
    "Inappropriate Content",
    "Scam or Fraud",
    "Misleading Information",
    "Other"
];

const ReportModal = ({ item_id, item_type, onClose, onSuccess, showToast }) => {
    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const supabase = createClient();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason) return;

        setIsSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            // Check if user has already reported this specific item of this type
            // Using .limit(1) instead of .maybeSingle() to avoid PGRST116 if multiple duplicates already exist
            const { data: existingReports, error: checkError } = await supabase
                .from('reports')
                .select('id')
                .eq('reporter_id', session.user.id)
                .eq('item_id', item_id)
                .eq('item_type', item_type)
                .limit(1);

            if (checkError) console.error("Duplicate check error:", checkError);

            if (existingReports && existingReports.length > 0) {
                showToast("You have already reported this item.", "warning");
                onClose();
                return;
            }

            const { error } = await supabase
                .from('reports')
                .insert([{
                    reporter_id: session.user.id,
                    item_id,
                    item_type,
                    reason,
                    details: details || null,
                    status: 'pending'
                }]);

            if (error) {
                console.error("Report insert error:", error.message, "| code:", error.code, "| details:", error.details, "| hint:", error.hint);
                throw error;
            }

            showToast("Report submitted. Thank you for keeping HiveZone safe!");
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error("Error submitting report:", error?.message || error);
            showToast("Failed to submit report. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-[10000] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
            <div
                className="w-full max-w-md bg-white rounded-[3rem] p-8 sm:p-10 shadow-2xl border-4 border-white animate-in zoom-in-95 duration-300 relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-8">
                    <h2 className="text-3xl font-black font-newyork text-gray-900 mb-2">Report Content</h2>
                    <p className="text-gray-500 font-bold leading-relaxed">Help us keep HiveZone safe for everyone.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Reason Dropdown */}
                    <CustomDropdown
                        label="Reason for reporting"
                        options={REPORT_REASONS}
                        value={reason}
                        onChange={setReason}
                        placeholder="Choose a reason..."
                    />

                    {/* Details */}
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-2">
                            Additional details <span className="font-normal normal-case tracking-normal text-gray-300 mt-1 block sm:inline">(optional)</span>
                        </label>
                        <textarea
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="Any additional context..."
                            rows={4}
                            className="w-full bg-gray-50/50 border border-transparent rounded-[1.5rem] p-4 font-bold text-gray-900 focus:bg-white focus:border-[#ffc107] focus:ring-4 focus:ring-[#ffc107]/10 outline-none transition-all resize-none placeholder:text-gray-300"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting || !reason}
                            className="w-full h-16 bg-black text-white rounded-full font-black text-lg hover:bg-zinc-800 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-4 border-[#ffc107] border-t-transparent rounded-full animate-spin"></div>
                                    <span>Submitting...</span>
                                </>
                            ) : (
                                "Submit Report"
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full h-14 rounded-full font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors active:scale-95"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;
