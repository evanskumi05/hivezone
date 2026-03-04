"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    UniversityIcon,
    Location01Icon,
    Calendar01Icon,
    Briefcase02Icon,
    ArrowRight01Icon,
    LinkSquare02Icon,
    BankIcon
} from "@hugeicons/core-free-icons";

// Dummy Scholarship Data (Admin Managed)
const scholarships = [
    {
        id: 1,
        title: "Mastercard Foundation Scholars Program",
        provider: "Mastercard Foundation",
        location: "Various Universities",
        amount: "Full Tuition + Stipend",
        deadline: "Nov 30, 2026",
        eligibility: "Undergraduate / Africa",
        description: "Comprehensive scholarship providing full tuition, accommodation, and a living stipend for academically talented yet economically disadvantaged young people in Africa.",
        logoUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=200&auto=format&fit=crop",
        applyLink: "#"
    },
    {
        id: 2,
        title: "MTN Bright Scholarship",
        provider: "MTN Ghana Foundation",
        location: "Ghana",
        amount: "Tuition & Accommodation",
        deadline: "May 15, 2026",
        eligibility: "Undergraduate / Public Tertiary",
        description: "The MTN Foundation offers scholarships to continuous students in public tertiary institutions across Ghana to ease their financial burden.",
        logoUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=200&auto=format&fit=crop",
        applyLink: "#"
    },
    {
        id: 3,
        title: "Women in STEM Google Scholarship",
        provider: "Google Tech",
        location: "Global",
        amount: "$10,000 USD",
        deadline: "Current / Rolling",
        eligibility: "Female / Tech Majors",
        description: "To help dismantle barriers that keep women from entering computing, Google offers scholarships to encourage women to excel in computing and technology.",
        logoUrl: "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=200&auto=format&fit=crop",
        applyLink: "#"
    },
    {
        id: 4,
        title: "Rhodes Scholarship West Africa",
        provider: "The Rhodes Trust",
        location: "University of Oxford, UK",
        amount: "Fully Funded Postgrad",
        deadline: "Sept 1, 2026",
        eligibility: "Postgraduate / West Africa",
        description: "The oldest and perhaps most prestigious international scholarship program, enabling outstanding young people across West Africa to study at the University of Oxford.",
        logoUrl: "https://images.unsplash.com/photo-1546430498-05c7b9472cb3?q=80&w=200&auto=format&fit=crop",
        applyLink: "#"
    }
];

export default function ScholarshipsPage() {
    return (
        <div className="flex flex-col min-h-screen bg-white md:bg-[#fcf6de] md:px-4 sm:px-8 max-w-[1400px] mx-auto w-full pb-24 md:pb-12 pt-4 md:pt-8">
            <div className="max-w-4xl mx-auto w-full flex flex-col h-full">

                {/* Header Section */}
                <div className="flex flex-col gap-2 px-4 md:px-0 mb-6 md:mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <HugeiconsIcon icon={BankIcon} className="w-5 h-5 text-blue-600" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black font-newyork text-gray-900">
                            Scholarships
                        </h1>
                    </div>
                    <p className="text-gray-500 font-medium max-w-2xl text-[15px] mt-2">
                        Curated list of available grants, financial aid, and scholarships for African students. This list is updated directly by the CampusHive administration teams.
                    </p>
                </div>

                {/* List Container */}
                <div className="flex flex-col gap-4 px-4 md:px-0 pb-20 md:pb-0 relative">
                    {scholarships.map((scholarship) => (
                        <div key={scholarship.id} className="bg-white border border-gray-100 rounded-3xl p-5 md:p-8 flex flex-col md:flex-row gap-6 md:items-start shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-blue-100 transition-colors">

                            {/* Logo/Image */}
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden shrink-0 border border-gray-100 hidden sm:block">
                                <img src={scholarship.logoUrl} alt={scholarship.provider} className="w-full h-full object-cover" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 flex flex-col">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-100 sm:hidden inline-block">
                                                <img src={scholarship.logoUrl} alt={scholarship.provider} className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider border border-blue-100">
                                                {scholarship.provider}
                                            </span>
                                        </div>
                                        <h2 className="text-[18px] md:text-[20px] font-black font-newyork text-gray-900 leading-tight">
                                            {scholarship.title}
                                        </h2>
                                    </div>
                                    <div className="hidden md:block text-right shrink-0">
                                        <span className="block font-black text-[18px] text-[#ffc107]">{scholarship.amount}</span>
                                        <span className="text-[12px] font-bold text-red-500">Deadline: {scholarship.deadline}</span>
                                    </div>
                                </div>

                                <p className="text-gray-600 text-[14px] font-medium leading-relaxed mb-5 max-w-3xl">
                                    {scholarship.description}
                                </p>

                                {/* Info Badges */}
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-auto">
                                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                                        <HugeiconsIcon icon={UniversityIcon} className="w-3.5 h-3.5 text-gray-500" />
                                        {scholarship.eligibility}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                                        <HugeiconsIcon icon={Location01Icon} className="w-3.5 h-3.5 text-gray-500" />
                                        {scholarship.location}
                                    </div>
                                    {/* Mobile-only financial info */}
                                    <div className="md:hidden flex items-center gap-3 w-full mt-2 pt-3 border-t border-gray-50">
                                        <span className="font-black text-[15px] text-[#ffc107] flex-1">{scholarship.amount}</span>
                                        <span className="text-[11px] font-bold text-red-500 uppercase flex items-center gap-1">
                                            <HugeiconsIcon icon={Calendar01Icon} className="w-3.5 h-3.5" />
                                            {scholarship.deadline}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Apply Button */}
                            <div className="w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 flex items-center md:self-center shrink-0">
                                <a
                                    href={scholarship.applyLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-black text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-gray-800 transition-colors group"
                                >
                                    <span>Apply Now</span>
                                    <HugeiconsIcon icon={LinkSquare02Icon} className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
