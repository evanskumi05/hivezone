"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Alert01Icon,
    Cancel01Icon
} from "@hugeicons/core-free-icons";

const ConfirmModal = ({
    title = "Are you sure?",
    message = "This action cannot be undone.",
    onConfirm,
    onCancel,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "danger"
}) => {
    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onCancel}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-gray-100 overflow-hidden"
            >
                {/* Close Button */}
                <button
                    onClick={onCancel}
                    className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 group"
                >
                    <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                </button>

                <div className="flex flex-col items-center text-center">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-sm ${type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                        }`}>
                        <HugeiconsIcon icon={Alert01Icon} className="w-8 h-8" strokeWidth={2.5} />
                    </div>

                    <h2 className="text-2xl font-black font-newyork text-gray-900 mb-2 tracking-tight leading-tight">
                        {title}
                    </h2>
                    <p className="text-gray-500 font-medium text-[15px] leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex flex-col w-full gap-3">
                        <button
                            onClick={onConfirm}
                            className={`w-full py-4 rounded-2xl font-black text-[15px] shadow-lg transition-all active:scale-[0.98] ${type === 'danger'
                                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200'
                                    : 'bg-[#ffc107] hover:bg-[#ffb300] text-gray-900 shadow-yellow-100'
                                }`}
                        >
                            {confirmText}
                        </button>
                        <button
                            onClick={onCancel}
                            className="w-full py-4 rounded-2xl font-bold text-[15px] text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ConfirmModal;
