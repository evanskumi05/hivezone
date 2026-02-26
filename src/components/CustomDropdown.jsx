"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";

const CustomDropdown = ({
    label,
    options = [],
    value,
    onChange,
    placeholder = "Select an option",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            return () => document.removeEventListener("keydown", handleKeyDown);
        }
    }, [isOpen]);

    const handleSelect = (option) => {
        onChange?.(option);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className="relative">
            {label && (
                <label className="block text-sm font-semibold mb-2">{label}</label>
            )}

            {/* Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={`
                    w-full bg-transparent border rounded-lg px-4 py-2.5 pr-10 text-sm text-left
                    outline-none transition-colors cursor-pointer
                    ${isOpen ? "border-[#ffc107]" : "border-zinc-300"}
                    ${value ? "text-zinc-900" : "text-zinc-400"}
                `}
            >
                {value || placeholder}
            </button>

            {/* Chevron */}
            <Image
                src="/icons/dropdown.svg"
                alt="Dropdown"
                width={12}
                height={12}
                className={`
                    absolute right-4 pointer-events-none
                    transition-transform duration-200
                    ${label ? "top-[42px]" : "top-[14px]"}
                    ${isOpen ? "rotate-180" : "rotate-0"}
                `}
            />

            {/* Options panel */}
            <div
                className={`
                    absolute z-50 left-0 right-0 mt-1.5
                    bg-white border border-zinc-200 rounded-lg shadow-lg
                    max-h-52 overflow-y-auto
                    transition-all duration-200 origin-top
                    ${isOpen
                        ? "opacity-100 scale-y-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 scale-y-95 -translate-y-1 pointer-events-none"
                    }
                `}
            >
                {options.map((option) => (
                    <div
                        key={option}
                        onClick={() => handleSelect(option)}
                        className={`
                            px-4 py-2.5 text-sm cursor-pointer transition-colors
                            hover:bg-[#ffc107]/10
                            ${option === value
                                ? "bg-[#ffc107]/15 font-medium text-zinc-900"
                                : "text-zinc-700"
                            }
                        `}
                    >
                        {option}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CustomDropdown;
