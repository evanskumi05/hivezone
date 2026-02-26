"use client";

import React from "react";
import Footer from "@/components/Footer";
import SecondaryNavbar from "@/components/SecondaryNavbar";

const PrivacyPage = () => {
    return (
        <div className="min-h-screen bg-[#f9e3a2] text-zinc-900 font-sans overflow-x-clip flex flex-col">
            <SecondaryNavbar />

            <main className="flex-1 pt-8 pb-20">
                <div className="max-w-3xl mx-auto px-6 md:px-12">
                    {/* Header */}
                    <section className="mb-12 text-center">
                        <h2 className="text-3xl font-bold flex justify-center gap-2 mb-2">
                            <span className="font-manyto text-[#ffc107]">Privacy</span>
                            <span className="font-manyto text-[#2c2c2c]">Policy</span>
                        </h2>
                        <p className="text-sm text-zinc-500">Last updated: February 25, 2026</p>
                    </section>

                    {/* Content */}
                    <div className="border-2 border-[#ffc107]/40 rounded-[2.5rem] p-8 md:p-14 space-y-10">
                        {[
                            {
                                title: "1. Information We Collect",
                                content:
                                    "We collect information you provide during registration, including your name, email address, student ID, institution, date of birth, and gender. We also collect usage data such as pages visited, features used, and device information to improve our platform.",
                            },
                            {
                                title: "2. How We Use Your Information",
                                content:
                                    "Your information is used to verify your student status, personalize your experience, match you with peers and opportunities, and communicate important updates. We do not sell your personal data to third parties.",
                            },
                            {
                                title: "3. Student Verification",
                                content:
                                    "HiveZone requires student ID verification to maintain a trusted, student-only community. Your student ID is used solely for verification purposes and is stored securely. We may cross-reference with institutional records where partnerships exist.",
                            },
                            {
                                title: "4. Data Sharing",
                                content:
                                    "We only share your data with third parties when required by law or with your explicit consent. Within the platform, your public display name and institution are visible to other users. Your personal details like email, date of birth, and student ID are never publicly displayed.",
                            },
                            {
                                title: "5. Anonymous Features",
                                content:
                                    "Certain features, such as anonymous chat rooms in the Mental Alleviation section, are designed to protect your identity. We do not link anonymous activity to your profile, and these interactions are not stored beyond the active session.",
                            },
                            {
                                title: "6. Data Security",
                                content:
                                    "We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your personal information. However, no method of digital transmission is 100% secure, and we cannot guarantee absolute security.",
                            },
                            {
                                title: "7. Cookies & Tracking",
                                content:
                                    "HiveZone uses essential cookies to maintain your session and preferences. We do not use third-party advertising trackers. Analytics data is collected anonymously to improve platform performance and user experience.",
                            },
                            {
                                title: "8. Your Rights",
                                content:
                                    "You have the right to access, correct, or delete your personal data at any time. You can update your profile information through your account settings or request a full data export. To delete your account and all associated data, contact us at support@hivezone.com.",
                            },
                            {
                                title: "9. Data Retention",
                                content:
                                    "We retain your data for as long as your account is active. If you delete your account, your personal data will be removed within 30 days. Anonymized usage data may be retained for analytics purposes.",
                            },
                            {
                                title: "10. Changes to This Policy",
                                content:
                                    "We may update this Privacy Policy from time to time. Significant changes will be communicated via email or an in-app notification. Continued use of HiveZone after changes constitutes acceptance of the updated policy.",
                            },
                            {
                                title: "11. Contact",
                                content:
                                    "For questions or concerns about your privacy, please contact us at support@hivezone.com.",
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

export default PrivacyPage;
