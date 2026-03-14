"use client";

import React, { useState } from "react";
import Footer from "@/components/Footer";
import SecondaryNavbar from "@/components/SecondaryNavbar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    HelpCircleIcon,
    ArrowRight01Icon,
    MessageQuestionIcon,
    SecurityCheckIcon,
    Wallet01Icon,
    UserGroupIcon,
    Search01Icon
} from "@hugeicons/core-free-icons";

const faqs = [
    {
        question: "What is Hivezone?",
        answer: "Hivezone is a student-focused digital platform designed to improve campus life by connecting students for academic collaboration, ethical earning opportunities, and peer support.",
        category: "General"
    },
    {
        question: "How do I create an account?",
        answer: "You can create an account by clicking the 'Register' button on the homepage. You'll need to use your university email or provide proof of student status.",
        category: "Getting Started"
    },
    {
        question: "Is Hivezone free to use?",
        answer: "Yes, the core features of Hivezone are free for all verified students. Some premium features or service-based transactions may have associated costs.",
        category: "General"
    },
    {
        question: "How can I earn on Hivezone?",
        answer: "Students can earn by offering 'Gigs' (services) to fellow students, such as tutoring, technical help, or creative services, within the Campus Hustle section.",
        category: "Earning"
    },
    {
        question: "How is my privacy protected?",
        answer: "We use secure encryption and verify all users to ensure a student-only environment. You can control your visibility settings in the dashboard.",
        category: "Security"
    }
];

export default function SupportPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#fcf6de] text-zinc-900 font-sans flex flex-col">
            <SecondaryNavbar />

            <main className="flex-1 py-12 px-6 md:px-12">
                <div className="max-w-4xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-sm mb-6">
                            <HugeiconsIcon icon={HelpCircleIcon} className="w-8 h-8 text-[#ffc107]" />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black font-newyork mb-4">How can we help?</h1>
                        <p className="text-lg text-zinc-700 font-medium max-w-2xl mx-auto">
                            Find answers to common questions or reach out to our team for personalized support.
                        </p>
                    </div>

                    {/* FAQ Section */}
                    <div className="mb-20">
                        <h2 className="text-3xl font-black font-newyork mb-8 text-center md:text-left">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            {filteredFaqs.length > 0 ? filteredFaqs.map((faq, idx) => (
                                <details key={idx} className="bg-white rounded-2xl shadow-sm overflow-hidden group">
                                    <summary className="p-6 cursor-pointer flex items-center justify-between font-bold text-lg list-none">
                                        <span>{faq.question}</span>
                                        <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center group-open:rotate-180 transition-transform">
                                            <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4 rotate-90" />
                                        </div>
                                    </summary>
                                    <div className="px-6 pb-6 text-zinc-600 font-medium leading-relaxed">
                                        {faq.answer}
                                        <div className="mt-4">
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-500 px-2 py-1 rounded">
                                                {faq.category}
                                            </span>
                                        </div>
                                    </div>
                                </details>
                            )) : (
                                <div className="text-center py-12 bg-white rounded-3xl shadow-sm">
                                    <p className="text-zinc-500 font-bold">No results found for "{searchQuery}"</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Still Need Help? */}
                    <div className="bg-black text-white rounded-[3rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black font-newyork mb-2">Still need help?</h2>
                            <p className="text-zinc-400 font-medium max-w-md">Our support team is always ready to assist you with any issues or feedback.</p>
                        </div>
                        <a href="/contact" className="bg-[#ffc107] text-black font-black px-10 py-5 rounded-full hover:bg-white transition-colors flex items-center gap-2 text-lg">
                            <HugeiconsIcon icon={MessageQuestionIcon} className="w-6 h-6" />
                            Contact Us
                        </a>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
