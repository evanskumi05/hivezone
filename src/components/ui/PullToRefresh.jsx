"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import Image from 'next/image';

export default function PullToRefresh({ onRefresh, children, className = "" }) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const wrapperRef = useRef(null);
    const spinnerControls = useAnimation();
    const childrenControls = useAnimation();
    
    const startX = useRef(0);
    const startY = useRef(0);
    const currentY = useRef(0);
    const isPulling = useRef(false);
    const isHorizontalSwipe = useRef(false);
    
    // Configurable thresholds
    const THRESHOLD = 50;
    const MAX_PULL = 80;
    const SPINNER_OFFSET = 20; // How far down it should rest while loading

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const handleTouchStart = (e) => {
            const container = document.getElementById('dashboard-scroll-container') || window;
            const scrollTop = container.scrollTop ?? container.scrollY;

            // Only engage if at the absolute top (with a 5px buffer for virtualization scrollers)
            if (scrollTop <= 5 && !isRefreshing) {
                isPulling.current = true;
                startY.current = e.touches[0].clientY;
                startX.current = e.touches[0].clientX;
                isHorizontalSwipe.current = false;
            }
        };

        const handleTouchMove = (e) => {
            if (!isPulling.current || isRefreshing || isHorizontalSwipe.current) return;

            const x = e.touches[0].clientX;
            const y = e.touches[0].clientY;
            const deltaX = Math.abs(x - startX.current);
            const deltaY = y - startY.current;

            // If moving more horizontally than vertically, abort PTR to allow sliders/navigation
            if (deltaX > Math.abs(deltaY) && deltaX > 10) {
                isHorizontalSwipe.current = true;
                isPulling.current = false;
                return;
            }

            // If pulling downwards
            if (deltaY > 0) {
                // Prevent native browser overscroll handling to ensure our visual rules apply
                if (e.cancelable) e.preventDefault();

                currentY.current = Math.min(deltaY * 0.4, MAX_PULL);
                
                // Animate ONLY spinner dropping down over the content
                spinnerControls.set({ y: currentY.current - 60, opacity: Math.min(1, currentY.current / THRESHOLD) });
            }
        };

        const handleTouchEnd = async () => {
            if (!isPulling.current) return;
            isPulling.current = false;

            if (currentY.current >= THRESHOLD && !isRefreshing) {
                setIsRefreshing(true);
                
                // Snap to refreshing state
                spinnerControls.start({ y: SPINNER_OFFSET, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } });

                try {
                    await onRefresh();
                } finally {
                    // Retract when done
                    setIsRefreshing(false);
                    spinnerControls.start({ y: -60, opacity: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } });
                    currentY.current = 0;
                }
            } else {
                // Abort if threshold not reached
                spinnerControls.start({ y: -60, opacity: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } });
                currentY.current = 0;
            }
        };

        // Attach non-passive listeners for preventDefault
        wrapper.addEventListener('touchstart', handleTouchStart, { passive: true });
        wrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
        wrapper.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            wrapper.removeEventListener('touchstart', handleTouchStart);
            wrapper.removeEventListener('touchmove', handleTouchMove);
            wrapper.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isRefreshing, onRefresh, spinnerControls, childrenControls]);

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            {/* The Floating Spinner */}
            <motion.div
                animate={spinnerControls}
                initial={{ y: -60, opacity: 0 }}
                className="absolute left-0 right-0 top-0 flex justify-center z-50 pointer-events-none"
            >
                <div className="bg-white rounded-full p-2.5 shadow-md border border-gray-100 flex items-center justify-center">
                    <Image 
                        src="/logoIcon.svg" 
                        alt="Loading" 
                        width={28} 
                        height={28} 
                        className={`transition-all duration-300 ${isRefreshing ? 'scale-110 opacity-100 animate-pulse' : 'scale-90 opacity-70'}`}
                        priority
                    />
                </div>
            </motion.div>

            {/* The Draggable Content */}
            <motion.div
                animate={childrenControls}
                initial={{ y: 0 }}
                className="w-full h-full flex flex-col flex-1 overflow-hidden"
            >
                {children}
            </motion.div>
        </div>
    );
}
