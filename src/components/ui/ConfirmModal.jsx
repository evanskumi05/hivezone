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
                className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative z-50 bg-white w-full max-w-[25rem] rounded-[1.75rem] p-8 sm:p-10 shadow-2xl overflow-hidden text-center mx-4"
            >
                {/* Close Button */}
                <button
                    onClick={onCancel}
                    className="absolute top-5 right-5 p-1 text-gray-400 hover:text-gray-700 transition-colors z-10"
                >
                    <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center">
                    {/* Icon */}
                    <div className="mt-2 mb-6">
                        <div className={`w-[3.25rem] h-[3.25rem] rounded-full flex items-center justify-center ${type === 'danger' ? 'bg-[#e6223b] text-white shadow-[0_0_0_4px_white,0_0_0_5px_#e6223b]' : 'bg-[#ffc107] text-black shadow-[0_0_0_4px_white,0_0_0_5px_#ffc107]'
                            }`}>
                            <HugeiconsIcon icon={Alert01Icon} className="w-6 h-6" variant="solid" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2.5">
                        {title}
                    </h2>
                    <p className="text-gray-500 font-medium text-[15px] mb-8 leading-snug">
                        {message}
                    </p>

                    <div className="flex flex-row w-full gap-3 mt-1">
                        <button
                            onClick={onCancel}
                            className="flex-1 h-12 rounded-[0.85rem] font-medium text-[15px] text-gray-900 border border-gray-900 hover:bg-gray-50 transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 h-12 rounded-[0.85rem] font-medium text-[15px] transition-colors ${type === 'danger'
                                    ? 'bg-[#e6223b] hover:bg-[#c91d33] text-white'
                                    : 'bg-[#ffc107] hover:bg-[#e6ae06] text-black'
                                }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ConfirmModal;
