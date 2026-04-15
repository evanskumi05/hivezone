"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
    BrainIcon,
    ArrowLeft01Icon
} from "@hugeicons/core-free-icons";
import Link from "next/link";

export default function MentalAlleviationDashboardPage() {
    return (
        <div className="flex flex-col min-h-[80vh] bg-[#fcf6de] items-center justify-center px-6 text-center">
            <div className="max-w-2xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* Icon Circle */}
                <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 mb-8">
                    <HugeiconsIcon icon={BrainIcon} className="w-12 h-12 text-[#ffc107]" />
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                    <h1 className="text-5xl sm:text-7xl font-black tracking-tight font-newyork text-gray-900 leading-tight">
                        Coming <span className="text-[#ffc107]">Soon</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-500 font-bold max-w-md mx-auto leading-relaxed">
                        We are building a safe, anonymous space for student wellness and guided reflection.
                    </p>
                </div>

                {/* CTA / Navigation */}
                <div className="pt-10">
                    <Link 
                        href="/dashboard" 
                        className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-full font-black text-sm hover:bg-gray-800 transition-all active:scale-95 shadow-xl"
                    >
                        <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
                    <div className="w-[500px] h-[500px] bg-[#ffc107]/5 rounded-full blur-[120px]"></div>
                </div>
            </div>
        </div>
    );
}
