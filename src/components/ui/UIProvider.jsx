"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';
import ImageModal from './ImageModal';
import ReportModal from './ReportModal';

const UIContext = createContext();

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};

export const UIProvider = ({ children }) => {
    const [confirmData, setConfirmData] = useState(null);
    const [fullScreenImage, setFullScreenImage] = useState(null);
    const [reportData, setReportData] = useState(null);

    const showToast = useCallback((message, type = 'success') => {
        if (type === 'error') {
            toast.error(message);
        } else if (type === 'loading') {
            toast.loading(message);
        } else if (type === 'warning') {
            toast(message, {
                icon: '⚠️',
                style: {
                    border: '1px solid #eebd29ff',
                    padding: '16px',
                    color: '#c4b587ff',
                    background: '#fdfcf8ff',
                },
            });
        } else {
            toast.success(message);
        }
    }, []);

    const confirmAction = useCallback((data) => {
        return new Promise((resolve) => {
            setConfirmData({
                ...data,
                onConfirm: async () => {
                    await (data.onConfirm || data.action)?.();
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

    const openReportModal = useCallback((data) => {
        setReportData(data);
    }, []);

    return (
        <UIContext.Provider value={{ showToast, confirmAction, showImage, openReportModal }}>
            {children}

            {/* React Hot Toast */}
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 4000,
                    style: {
                        fontFamily: 'inherit',
                        fontWeight: '600',
                        fontSize: '14px',
                        borderRadius: '10px',
                        padding: '12px 16px',
                    },
                    success: {
                        iconTheme: { primary: '#0ca120ff', secondary: '#f8f3f3ff' },
                    },
                    error: {
                        iconTheme: { primary: '#e71d1dff', secondary: '#f8f3f3ff' },
                    },
                }}
            />

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

            {/* Report Modal */}
            <AnimatePresence>
                {reportData && (
                    <ReportModal
                        {...reportData}
                        onClose={() => setReportData(null)}
                        showToast={showToast}
                    />
                )}
            </AnimatePresence>
        </UIContext.Provider>
    );
};
