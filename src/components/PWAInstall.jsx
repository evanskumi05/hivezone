"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Cancel01Icon,
    Share01Icon,
    PlusSignIcon,
    SmartPhone01Icon,
    Download01Icon,
    InformationCircleIcon
} from "@hugeicons/core-free-icons";

const PWAInstall = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Detect iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(ios);

        // Detect Standalone
        const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        setIsStandalone(standalone);

        // Capture beforeinstallprompt
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            
            // Show modal if not dismissed and not in standalone
            checkAndShow();
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Custom event to force-show the modal (from settings)
        const handleForceShow = () => {
            setShowModal(true);
        };
        window.addEventListener('hivezone-show-pwa-install', handleForceShow);

        // For iOS, check on mount
        if (ios && !standalone) {
            checkAndShow();
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('hivezone-show-pwa-install', handleForceShow);
        };
    }, []);

    const checkAndShow = () => {
        const hasBeenShown = localStorage.getItem('hivezone_pwa_shown');
        if (!hasBeenShown) {
            setShowModal(true);
        }
    };

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setShowModal(false);
                localStorage.setItem('hivezone_pwa_shown', 'true');
            }
        }
    };

    const handleDismiss = () => {
        setShowModal(false);
        localStorage.setItem('hivezone_pwa_shown', 'true');
    };

    if (isStandalone) return null;

    return (
        <AnimatePresence>
            {showModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss}
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 40 }}
                        className="relative bg-[#fcf6de] w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-white/20 overflow-hidden"
                    >
                        {/* Decorative Background Elements */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#ffc107]/20 rounded-full blur-3xl" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#ffc107]/10 rounded-full blur-3xl" />

                        {/* Close Button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-6 right-6 p-2 hover:bg-black/5 rounded-full transition-colors text-gray-400 group z-10"
                        >
                            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        </button>

                        <div className="flex flex-col items-center text-center relative z-0">
                            {/* App Icon / Graphic */}
                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-yellow-500/10 border border-yellow-100">
                                <HugeiconsIcon icon={SmartPhone01Icon} className="w-10 h-10 text-[#ffc107]" strokeWidth={2} />
                            </div>

                            <h2 className="text-3xl font-black font-newyork text-gray-900 mb-3 tracking-tight leading-tight">
                                Install HiveZone
                            </h2>
                            <p className="text-gray-600 font-medium text-[16px] leading-relaxed mb-8 px-4">
                                Add HiveZone to your home screen for the best experience, including offline access and instant notifications.
                            </p>

                            {isIOS ? (
                                /* iOS Specific Instructions */
                                <div className="w-full bg-white/50 backdrop-blur-sm rounded-3xl p-6 mb-8 border border-white/50 text-left">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4" />
                                        Instructions for Safari
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-[#ffc107] rounded-xl flex items-center justify-center shrink-0">
                                                <HugeiconsIcon icon={Share01Icon} className="w-5 h-5 text-white" />
                                            </div>
                                            <p className="text-gray-700 font-bold text-[15px]">
                                                Tap the <span className="text-[#ffc107]">Share</span> button in Safari
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shrink-0">
                                                <HugeiconsIcon icon={PlusSignIcon} className="w-5 h-5 text-white" />
                                            </div>
                                            <p className="text-gray-700 font-bold text-[15px]">
                                                Find and tap <span className="text-gray-900">Add to Home Screen</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Android/Other Instructions */
                                <div className="w-full mb-8">
                                    <button
                                        onClick={handleInstall}
                                        className="w-full py-4 bg-[#ffc107] hover:bg-[#ffb300] text-gray-900 rounded-[1.25rem] font-black text-lg shadow-xl shadow-yellow-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <HugeiconsIcon icon={Download01Icon} className="w-5 h-5" strokeWidth={3} />
                                        Install Now
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={handleDismiss}
                                className="text-gray-500 font-bold text-sm hover:text-gray-800 transition-colors py-2"
                            >
                                {isIOS ? "I've added it" : "Maybe later"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PWAInstall;
