"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from "@hugeicons/react";
import {
    CheckmarkBadge01Icon,
    Alert01Icon,
    InformationCircleIcon,
    Cancel01Icon
} from "@hugeicons/core-free-icons";

const toastTypes = {
    success: {
        icon: CheckmarkBadge01Icon,
        color: "text-green-500",
        bg: "bg-green-50/90",
        border: "border-green-100",
        shadow: "shadow-green-900/5"
    },
    error: {
        icon: Alert01Icon,
        color: "text-red-500",
        bg: "bg-red-50/90",
        border: "border-red-100",
        shadow: "shadow-red-900/5"
    },
    info: {
        icon: InformationCircleIcon,
        color: "text-blue-500",
        bg: "bg-blue-50/90",
        border: "border-blue-100",
        shadow: "shadow-blue-900/5"
    }
};

const Toast = ({ message, type = 'success', onClose }) => {
    const config = toastTypes[type] || toastTypes.success;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`pointer-events-auto min-w-[280px] sm:min-w-[340px] flex items-center justify-between p-4 rounded-2xl border ${config.bg} ${config.border} ${config.shadow} shadow-xl backdrop-blur-md`}
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-white shadow-sm ${config.color}`}>
                    <HugeiconsIcon icon={config.icon} className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <p className="text-gray-900 font-bold text-[14px] leading-tight pr-4">{message}</p>
            </div>
            <button
                onClick={onClose}
                className="p-1.5 hover:bg-black/5 rounded-xl transition-colors text-gray-400 hover:text-gray-600 shrink-0"
            >
                <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" strokeWidth={2.5} />
            </button>
        </motion.div>
    );
};

export default Toast;
