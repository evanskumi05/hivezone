"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image"

const WelcomeBanner = ({ firstName }) => {
    const [greeting, setGreeting] = useState(() => {
        if (typeof window !== "undefined") {
            const hour = new Date().getHours();
            if (hour < 12) return "Good Morning!";
            if (hour < 18) return "Good Afternoon!";
            return "Good Evening!";
        }
        return "Good Morning!";
    });

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good Morning!");
        else if (hour < 18) setGreeting("Good Afternoon!");
        else setGreeting("Good Evening!");
    }, []);

    return (
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-[#fcf6de] flex flex-col items-start gap-4 w-full">
            <div className="w-full">
                <h1 suppressHydrationWarning className="text-3xl sm:text-4xl font-black tracking-wide font-newyork text-gray-900 mb-2 sm:mb-3">{greeting} {firstName || "there"}</h1>
            </div>
        </div>
    );
};

export default WelcomeBanner;
