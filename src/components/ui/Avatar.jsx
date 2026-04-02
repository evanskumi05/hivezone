"use client";

import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserCircle02Icon } from "@hugeicons/core-free-icons";
import { avatarUrl } from "@/utils/optimizeImage";

/**
 * Avatar component with support for Cloudflare Image Resizing.
 * 
 * Fixes:
 * - Falls back to default icon if image fails to load.
 * - Respects parent dimensions without extra "zooming".
 * - Uses object-cover for standard profile picture centering.
 */
export default function Avatar({ src, name = "", className = "" }) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (src && !loaded && !error) {
            const timer = setTimeout(() => {
                setError(true);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [src, loaded, error]);

    // Optimize the avatar URL — serves a compressed version via Cloudflare CDN if enabled.
    // Resolution is 300px to avoid blurriness on mobile/retina screens.
    const optimizedSrc = src ? avatarUrl(src) : null;

    if (optimizedSrc && !error) {
        return (
            <div className={`relative overflow-hidden flex-shrink-0 ${className}`}>
                <img
                    src={optimizedSrc}
                    alt={name}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setLoaded(true)}
                    onError={() => setError(true)}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${!loaded ? 'bg-gray-100' : ''}`}
                />
                {!loaded && !error && (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                         <div className="w-1/2 h-1/2 rounded-full bg-gray-200" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center bg-gray-100 flex-shrink-0 ${className}`}>
            <HugeiconsIcon icon={UserCircle02Icon} className="w-[75%] h-[75%] opacity-40 text-gray-500" />
        </div>
    );
}
