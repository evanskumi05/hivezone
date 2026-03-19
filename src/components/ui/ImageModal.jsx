"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Download01Icon } from "@hugeicons/core-free-icons";

const ImageModal = ({ src, onClose }) => {
    if (!src) return null;

    const isVideo = src.match(/\.(mp4|webm|ogg|mov)$/i);

    const handleDownload = async () => {
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const ext = isVideo ? 'mp4' : 'jpg';
            link.download = `HiveZone-media-${Date.now()}.${ext}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download media:", error);
        }
    };

    return (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 sm:p-8">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/90 backdrop-blur-xl cursor-pointer"
            />

            {/* toolbar */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10 pointer-events-none"
            >
                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 pointer-events-auto">
                    <span className="text-white/70 text-sm font-medium">Full View</span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDownload}
                        className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-2xl transition-all active:scale-90 pointer-events-auto"
                        title="Download Image"
                    >
                        <HugeiconsIcon icon={Download01Icon} className="w-6 h-6" strokeWidth={2} />
                    </button>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-2xl transition-all active:scale-90 pointer-events-auto"
                        title="Close"
                    >
                        <HugeiconsIcon icon={Cancel01Icon} className="w-6 h-6" strokeWidth={2.5} />
                    </button>
                </div>
            </motion.div>

            {/* Image Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative max-w-full max-h-full flex items-center justify-center p-4 pointer-events-none"
                onClick={(e) => e.stopPropagation()}
            >
                {isVideo ? (
                    <video
                        src={src}
                        controls
                        autoPlay
                        loop
                        playsInline
                        className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10 pointer-events-auto bg-black"
                    />
                ) : (
                    <img
                        src={src}
                        alt="Full view"
                        className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10 select-none pointer-events-auto"
                    />
                )}
            </motion.div>
        </div>
    );
};

export default ImageModal;
