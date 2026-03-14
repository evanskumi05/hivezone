"use client";

import React from "react";
import Footer from "@/components/Footer";
import SecondaryNavbar from "@/components/SecondaryNavbar";

const TermsPage = () => {
    return (
        <div className="min-h-screen bg-[#fcf6de] text-zinc-900 font-sans overflow-x-clip flex flex-col">
            <SecondaryNavbar />

            <main className="flex-1 pt-8 pb-20">
                <div className="max-w-3xl mx-auto px-6 md:px-12">
                    {/* Header */}
                    <section className="mb-12 text-center">
                        <h2 className="text-3xl font-bold flex justify-center gap-2 mb-2">
                            <span className="font-manyto text-[#ffc107]">Terms</span>
                            <span className="font-manyto text-[#2c2c2c]">Of Service</span>
                        </h2>
                        <p className="text-sm text-zinc-500">Last updated: February 25, 2026</p>
                    </section>

                    {/* Content */}
                    <div className="border-2 border-[#ffc107]/40 rounded-[2.5rem] p-8 md:p-14 space-y-10">
                        {[
                            {
                                title: "1. Acceptance of Terms",
                                content:
                                    "By accessing or using HiveZone, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our platform. These terms apply to all users, including students, visitors, and contributors.",
                            },
                            {
                                title: "2. Eligibility",
                                content:
                                    "HiveZone is exclusively available to verified students of participating universities. You must provide a valid student ID and institutional email to register. You must be at least 16 years of age to use this platform.",
                            },
                            {
                                title: "3. User Accounts",
                                content:
                                    "You are responsible for maintaining the confidentiality of your account credentials. Any activity under your account is your responsibility. You agree to provide accurate information during registration and to keep it updated. HiveZone reserves the right to suspend or terminate accounts that violate these terms.",
                            },
                            {
                                title: "4. Acceptable Use",
                                content:
                                    "You agree not to use HiveZone to post harmful, misleading, or illegal content. Harassment, impersonation, spam, and academic dishonesty are strictly prohibited. All gig listings and academic collaborations must be ethical and aligned with university policies.",
                            },
                            {
                                title: "5. Intellectual Property",
                                content:
                                    "All content, branding, and design elements on HiveZone are owned by HiveZone or its licensors. Users retain ownership of content they create but grant HiveZone a non-exclusive license to display it on the platform.",
                            },
                            {
                                title: "6. Limitation of Liability",
                                content:
                                    "HiveZone is provided \"as is\" without warranties of any kind. We are not responsible for disputes between users, the quality of gig services, or any damages arising from the use of our platform. We do our best to maintain a safe environment but cannot guarantee it.",
                            },
                            {
                                title: "7. Termination",
                                content:
                                    "We may suspend or terminate your access to HiveZone at any time, with or without cause. Upon termination, your right to use the platform ceases immediately. You may also delete your account at any time through your settings.",
                            },
                            {
                                title: "8. Changes to Terms",
                                content:
                                    "HiveZone reserves the right to update these Terms of Service at any time. Continued use of the platform after changes constitutes acceptance. We will notify registered users of significant changes via email.",
                            },
                            {
                                title: "9. Contact",
                                content:
                                    "If you have any questions about these terms, please reach out to us at support@hivezone.co.",
                            },
                        ].map((section, index) => (
                            <div key={index}>
                                <h3 className="text-xl font-bold font-manyto mb-3">
                                    {section.title}
                                </h3>
                                <p className="text-[1.05rem] leading-relaxed text-zinc-700">
                                    {section.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default TermsPage;
