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
// Global Session Cache for Avatars
// This allows us to skip the 'fade-in' for images we've already seen, 
// ensuring Frame-1 visibility if they are locally cached.
const AVATAR_CACHE = new Set();

export default function Avatar({ src, name = "", className = "" }) {
    const [hasMounted, setHasMounted] = useState(false);
    const optimizedSrc = src ? avatarUrl(src) : null;
    const isAlreadyCached = optimizedSrc ? AVATAR_CACHE.has(optimizedSrc) : false;

    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        setHasMounted(true);
        if (isAlreadyCached) setLoaded(true);
    }, [isAlreadyCached]);

    useEffect(() => {
        if (src && !loaded && !error) {
            const timer = setTimeout(() => {
                setError(true);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [src, loaded, error]);

    // To prevent hydration mismatches, we ensure the server and client 
    // render the exact same skeletal structure on the first pass.
    return (
        <div className={`relative overflow-hidden flex-shrink-0 ${className} ${!loaded || !optimizedSrc || error ? 'bg-gray-100' : ''}`}>
            {/* 1. The actual image (Client-only until mount to avoid mismatching cached states) */}
            {hasMounted && optimizedSrc && !error && (
                <img
                    src={optimizedSrc}
                    alt={name}
                    fetchPriority="high"
                    decoding="async"
                    onLoad={() => {
                        setLoaded(true);
                        AVATAR_CACHE.add(optimizedSrc);
                    }}
                    onError={() => setError(true)}
                    className={`w-full h-full object-cover transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                />
            )}

            {/* 2. The Loading Placeholder (Visible until image loads) */}
            {hasMounted && !loaded && optimizedSrc && !error && (
                <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-1/2 h-1/2 rounded-full bg-gray-200" />
                </div>
            )}

            {/* 3. The Fallback Icon (Generic SSR-safe fallback) */}
            {(!optimizedSrc || error) && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <HugeiconsIcon icon={UserCircle02Icon} className="w-[75%] h-[75%] opacity-40 text-gray-500" />
                </div>
            )}
        </div>
    );
}
