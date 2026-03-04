"use client";

import React, { useRef, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon } from "@hugeicons/core-free-icons";

export default function AutoPauseVideo({ src, className, ...props }) {
    const videoRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting && videoRef.current) {
                    // Force pause when the video leaves the viewport
                    videoRef.current.pause();
                }
            },
            {
                threshold: 0.1 // Triggers when 90% of the video is out of view
            }
        );

        if (videoRef.current) {
            observer.observe(videoRef.current);
        }

        return () => {
            if (videoRef.current) {
                observer.unobserve(videoRef.current);
            }
        };
    }, []);

    // Append #t=0.001 to force the browser to load the first frame as a poster if no poster is provided natively.
    const videoSrc = src?.includes('#t=') ? src : `${src}#t=0.001`;

    return (
        <div
            className="w-full relative group cursor-pointer"
            onClick={props.onClick}
        >
            <video
                ref={videoRef}
                src={videoSrc}
                preload="metadata"
                playsInline
                className={`${className} pointer-events-none`}
                {...props}
            />
            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-[#ffc107]/90 backdrop-blur-md flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300">
                    <HugeiconsIcon icon={PlayIcon} className="w-8 h-8 text-black ml-1" />
                </div>
            </div>
        </div>
    );
}
