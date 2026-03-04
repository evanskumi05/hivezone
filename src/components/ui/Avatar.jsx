"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { UserCircle02Icon } from "@hugeicons/core-free-icons";

/**
 * Avatar component — shows profile picture if available,
 * otherwise renders a profile icon on a white/gray background.
 *
 * Props:
 *   src       - image URL (may be null/undefined)
 *   name      - alt text for the image
 *   className - classes for the outer container (size, shape, etc.)
 */
export default function Avatar({ src, name = "", className = "" }) {
    if (src) {
        return (
            <div className={`overflow-hidden ${className}`}>
                <img
                    src={src}
                    alt={name}
                    className="w-full h-full object-cover"
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
