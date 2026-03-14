"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";
import SecondaryNavbar from "@/components/SecondaryNavbar";
import CustomDropdown from "@/components/CustomDropdown";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    InstagramIcon,
    SentIcon
} from "@hugeicons/core-free-icons";

const SUBJECTS = [
    "General Inquiry",
    "Technical Support",
    "Billing Question",
    "Partnership Idea",
    "Report an Issue"
];

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSubmitting(false);
        setIsSent(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
    };

    return (
        <div className="min-h-screen bg-[#fcf6de] text-zinc-900 font-sans flex flex-col">
            <SecondaryNavbar />

            <main className="flex-1 flex flex-col items-center px-6 pb-16">
                {/* Hero Heading */}
                <div className="mb-10 text-center">
                    <h1 className="text-5xl md:text-6xl pt-14 font-bold font-manyto">
                        Get in
                        <br />
                        <span className="text-[#ffc107]">Touch</span><span className="text-[#2c2c2c]">With</span><span className="text-[#ffc107]">Us</span>
                    </h1>
                </div>

                {/* Down Arrow */}
                <div className="mb-10">
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                        <Image
                            src="/icons/downarrow.svg"
                            alt="Down arrow"
                            width={20}
                            height={20}
                        />
                    </div>
                </div>

                <div className="w-full max-w-md flex flex-col gap-8">
                    {/* Form Card */}
                    {isSent ? (
                        <div className="border-2 border-[#ffc107]/40 rounded-[2rem] px-6 py-12 text-center space-y-4">
                            <div className="w-16 h-16 bg-[#ffc107]/10 text-[#ffc107] rounded-full flex items-center justify-center mx-auto">
                                <HugeiconsIcon icon={SentIcon} className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold font-manyto">Message Sent!</h2>
                            <p className="text-zinc-500 text-sm font-medium">We've received your message and will get back to you shortly.</p>
                            <button
                                onClick={() => setIsSent(false)}
                                className="mt-4 w-full bg-[#ffc107] text-black font-semibold text-base py-3 hover:bg-[#ffca2c] transition-colors active:scale-[0.98]"
                            >
                                Send another message
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="border-2 border-[#ffc107]/40 rounded-[2rem] px-6 py-10 space-y-7">
                            {/* Name & Email */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Full Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#ffc107] transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Email</label>
                                    <input
                                        required
                                        type="email"
                                        placeholder="john@uni.edu"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#ffc107] transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <CustomDropdown
                                    label="Subject"
                                    options={SUBJECTS}
                                    value={formData.subject}
                                    onChange={(val) => setFormData({ ...formData, subject: val })}
                                    placeholder="Choose a subject..."
                                />
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-sm font-semibold mb-2">Message</label>
                                <textarea
                                    required
                                    rows={5}
                                    placeholder="How can we help you today?"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#ffc107] transition-colors resize-none placeholder:text-gray-600"
                                />
                            </div>
                        </form>
                    )}

                    {/* Sign In Link style row */}
                    {!isSent && (
                        <div className="text-center text-lg -mt-2">
                            <span className="text-zinc-900">Need immediate help? </span>
                            <Link href="mailto:support@hivezone.co" className="text-[#ffc107] font-semibold hover:underline">
                                Email us directly
                            </Link>
                        </div>
                    )}

                    {/* Submit Button */}
                    {!isSent && (
                        <div className="w-full -mt-2">
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full bg-[#ffc107] text-black font-semibold text-xl py-4 flex items-center justify-center gap-3 hover:bg-[#ffca2c] transition-colors active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Image
                                        src="/icons/rightarrow.svg"
                                        alt="Arrow"
                                        width={24}
                                        height={24}
                                        className="invert"
                                    />
                                )}
                                <span>{isSubmitting ? "Sending..." : "Send Message"}</span>
                            </button>
                        </div>
                    )}


                    {/* Social links */}
                    <div className="flex gap-3 pb-4">
                        <a href="https://instagram.com/hivezoneofficial" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-[#ffc107] hover:text-black transition-all">
                            <HugeiconsIcon icon={InstagramIcon} className="w-4 h-4" />
                        </a>
                        <a href="https://twitter.com/hivezone_co" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-[#ffc107] hover:text-black transition-all">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        </a>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
