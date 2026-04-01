"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserCircle02Icon } from "@hugeicons/core-free-icons";

export default function Avatar({ src, name = "", className = "" }) {
    const [loaded, setLoaded] = useState(false);

    if (src) {
        return (
            <div className={`overflow-hidden ${className}`}>
                <img
                    src={src}
                    alt={name}
                    loading="lazy"
                    ref={el => { if (el?.complete) setLoaded(true); }}
                    onLoad={() => setLoaded(true)}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                />
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
            <HugeiconsIcon icon={UserCircle02Icon} size="75%" className="text-gray-400" />
        </div>
    );
}
