"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image"

const WelcomeBanner = ({ firstName, email }) => {
    const [greeting, setGreeting] = useState("Good Morning!");

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) {
            setGreeting("Good Morning!");
        } else if (hour < 18) {
            setGreeting("Good Afternoon!");
        } else {
            setGreeting("Good Evening!");
        }
    }, []);

    return (
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-[#fcf6de] flex flex-col items-start gap-4 w-full">
            <div className="w-full">
                <h1 className="text-3xl sm:text-4xl font-black tracking-wide font-newyork text-gray-900 mb-2 sm:mb-3">{greeting} {firstName || "there"}</h1>
                <div className="inline-flex items-center px-4 py-1 rounded-full border border-gray-200 text-xs text-gray-400 font-medium bg-white shadow-sm">
                    {email || ""}
                </div>
            </div>

            <button className="mt-2 w-full sm:w-auto bg-[#ffc107] hover:bg-[#ffca2c] text-black font-semibold text-[14px] sm:text-[15px] py-3.5 px-6 rounded-full flex items-center justify-center sm:justify-start gap-2 transition-colors shadow-sm group">
                Pick up from where you left
                <Image
                    src="/icons/rightarrow.svg"
                    alt="Arrow"
                    width={20}
                    height={20}
                    className="transition-transform group-hover:translate-x-1 invert"
                />
            </button>
        </div>
    );
};

export default WelcomeBanner;
