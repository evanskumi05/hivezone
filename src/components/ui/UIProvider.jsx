"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Toast from './Toast';
import ConfirmModal from './ConfirmModal';
import ImageModal from './ImageModal';

const UIContext = createContext();

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};

export const UIProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [confirmData, setConfirmData] = useState(null);
    const [fullScreenImage, setFullScreenImage] = useState(null);

    const showToast = useCallback((message, type = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const confirmAction = useCallback((data) => {
        return new Promise((resolve) => {
            setConfirmData({
                ...data,
                onConfirm: () => {
                    data.onConfirm?.();
                    setConfirmData(null);
                    resolve(true);
                },
                onCancel: () => {
                    data.onCancel?.();
                    setConfirmData(null);
                    resolve(false);
                }
            });
        });
    }, []);

    const showImage = useCallback((src) => {
        setFullScreenImage(src);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <UIContext.Provider value={{ showToast, confirmAction, showImage }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 sm:top-auto sm:bottom-6 left-0 right-0 sm:left-auto sm:right-6 z-[9999] flex flex-col items-center sm:items-end gap-3 pointer-events-none w-full sm:max-w-[400px] px-4 sm:px-0">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <Toast
                            key={toast.id}
                            {...toast}
                            onClose={() => removeToast(toast.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* Confirm Modal */}
            <AnimatePresence>
                {confirmData && (
                    <ConfirmModal
                        {...confirmData}
                    />
                )}
            </AnimatePresence>

            {/* Image Modal */}
            <AnimatePresence>
                {fullScreenImage && (
                    <ImageModal
                        src={fullScreenImage}
                        onClose={() => setFullScreenImage(null)}
                    />
                )}
            </AnimatePresence>
        </UIContext.Provider>
    );
};
