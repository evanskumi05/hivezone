"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    UniversityIcon,
    Location01Icon,
    Calendar01Icon,
    Briefcase02Icon,
    LinkSquare02Icon
} from "@hugeicons/core-free-icons";

// Dummy Internship Data (Admin Managed)
const internships = [
    {
        id: 1,
        title: "Software Engineering Intern (Summer 2026)",
        company: "Paystack",
        location: "Accra, Ghana (Hybrid)",
        type: "Paid Internship",
        deadline: "Apply by March 30, 2026",
        eligibility: "Penultimate Year / CS Majors",
        description: "Join the core product team at Paystack to build payment infrastructure for Africa. You will work alongside senior engineers on real-world features shipping to thousands of merchants.",
        logoUrl: "https://images.unsplash.com/photo-1542744094-24638ea0b4b6?q=80&w=200&auto=format&fit=crop",
        applyLink: "#"
    },
    {
        id: 2,
        title: "Marketing & Growth Intern",
        company: "MTN Group",
        location: "Abuja, Nigeria",
        type: "Full-Time (3 Months)",
        deadline: "Apply by April 15, 2026",
        eligibility: "Business & Comms Majors",
        description: "Assist the regional marketing team with campaign executions, social media strategy, and youth-focused user acquisition initiatives across West Africa.",
        logoUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=200&auto=format&fit=crop",
        applyLink: "#"
    },
    {
        id: 3,
        title: "Data Science Research Intern",
        company: "Google AI Center",
        location: "Accra, Ghana",
        type: "Paid Research Intern",
        deadline: "Rolling Admissions",
        eligibility: "MSc/PhD Students in AI/ML",
        description: "Contribute to cutting-edge research in natural language processing specifically catering to African languages and localized AI models.",
        logoUrl: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?q=80&w=200&auto=format&fit=crop",
        applyLink: "#"
    },
    {
        id: 4,
        title: "UI/UX Design Intern",
        company: "Flutterwave",
        location: "Remote",
        type: "Part-Time",
        deadline: "Apply by May 1, 2026",
        eligibility: "Portfolio Required",
        description: "Help design intuitive interfaces for millions of users. You'll participate in user research, wireframing, and refining the mobile app experience under mentorship.",
        logoUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=200&auto=format&fit=crop",
        applyLink: "#"
    }
];

export default function InternshipsPage() {
    return (
        <div className="flex flex-col min-h-screen bg-white md:bg-[#fcf6de] md:px-4 sm:px-8 max-w-[1400px] mx-auto w-full pb-24 md:pb-12 pt-4 md:pt-8">
            <div className="max-w-4xl mx-auto w-full flex flex-col h-full">

                {/* Header Section */}
                <div className="flex flex-col gap-2 px-4 md:px-0 mb-6 md:mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <HugeiconsIcon icon={Briefcase02Icon} className="w-5 h-5 text-purple-600" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black font-newyork text-gray-900">
                            Internships
                        </h1>
                    </div>
                    <p className="text-gray-500 font-medium max-w-2xl text-[15px] mt-2">
                        Verified internship and early-career opportunities curated from top companies. Give your career a head start by applying to these roles updated by the administrative team.
                    </p>
                </div>

                {/* List Container */}
                <div className="flex flex-col gap-4 px-4 md:px-0 pb-20 md:pb-0">
                    {internships.map((internship) => (
                        <div key={internship.id} className="bg-white border border-gray-100 rounded-3xl p-5 md:p-8 flex flex-col md:flex-row gap-6 md:items-start shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-purple-100 transition-colors group">

                            {/* Logo/Image */}
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden shrink-0 border border-gray-100 hidden sm:block">
                                <img src={internship.logoUrl} alt={internship.company} className="w-full h-full object-cover" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 flex flex-col">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-100 sm:hidden inline-block">
                                                <img src={internship.logoUrl} alt={internship.company} className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-wider border border-purple-100">
                                                {internship.company}
                                            </span>
                                        </div>
                                        <h2 className="text-[18px] md:text-[20px] font-black font-newyork text-gray-900 leading-tight">
                                            {internship.title}
                                        </h2>
                                    </div>
                                    <div className="hidden md:block text-right shrink-0">
                                        <span className="block font-black text-[15px] text-gray-900 bg-gray-100 px-3 py-1 rounded-full">{internship.type}</span>
                                        <span className="text-[12px] font-bold text-gray-400 mt-2 block">{internship.deadline}</span>
                                    </div>
                                </div>

                                <p className="text-gray-600 text-[14px] font-medium leading-relaxed mb-5 max-w-3xl">
                                    {internship.description}
                                </p>

                                {/* Info Badges */}
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-auto">
                                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                                        <HugeiconsIcon icon={UniversityIcon} className="w-3.5 h-3.5 text-gray-500" />
                                        {internship.eligibility}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                                        <HugeiconsIcon icon={Location01Icon} className="w-3.5 h-3.5 text-gray-500" />
                                        {internship.location}
                                    </div>

                                    {/* Mobile-only info */}
                                    <div className="md:hidden flex flex-col gap-2 w-full mt-2 pt-3 border-t border-gray-50">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-[13px] text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-md">{internship.type}</span>
                                            <span className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1">
                                                <HugeiconsIcon icon={Calendar01Icon} className="w-3.5 h-3.5" />
                                                {internship.deadline}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Apply Button */}
                            <div className="w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 flex items-center md:self-center shrink-0">
                                <a
                                    href={internship.applyLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-purple-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-purple-700 transition-colors"
                                >
                                    <span>Apply Now</span>
                                    <HugeiconsIcon icon={LinkSquare02Icon} className="w-4 h-4 text-purple-200" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
