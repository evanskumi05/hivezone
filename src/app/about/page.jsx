"use client";

import React from "react";
import Image from "next/image";
import Footer from "@/components/Footer";
import SecondaryNavbar from "@/components/SecondaryNavbar";

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-[#f9e3a2] text-zinc-900 font-sans overflow-x-clip flex flex-col">
            {/* Navigation */}
            <SecondaryNavbar />

            {/* Page Content */}
            <main className="flex-1 pt-8">
                <div className="max-w-6xl mx-auto px-6 md:px-12 flex flex-col">
                    {/* Sub Header */}
                    <section className="w-full mb-6 md:mb-12 text-center">
                        <h2 className="text-2xl md:text-3xl font-bold flex justify-center gap-2">
                            <span className="font-manyto text-[#ffc107]">About</span>
                            <span className="font-manyto text-[#2c2c2c]">Us</span>
                        </h2>
                    </section>

                    {/* Hero */}
                    <section className="w-full mb-10 md:mb-20">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-16">
                            {/* Mobile: text with shapes behind */}
                            <div className="relative w-full lg:w-auto">
                                <h1 className="text-[3.2rem] md:text-7xl lg:text-[5.5rem] font-bold font-manyto leading-[1.05] text-black max-w-xl relative z-10">
                                    The zone
                                    <br />
                                    for
                                    <br />
                                    student –
                                    <br />
                                    powered
                                    <br />
                                    digital
                                    <br />
                                    ecosystem
                                </h1>

                                {/* shapes.svg behind the text on mobile */}
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[420px] md:hidden z-0">
                                    <Image
                                        src="/shapes.svg"
                                        alt="Geometric shapes"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </div>

                            {/* Desktop shapes */}
                            <div className="relative hidden md:block w-[600px] h-[650px] shrink-0">
                                <Image
                                    src="/shapes.svg"
                                    alt="Geometric shapes"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Who We Are */}
                    <section className="w-full mb-10 md:mb-20">
                        <div className="max-w-3xl mx-auto text-center">
                            <h2 className="text-3xl md:text-4xl font-bold font-manyto mb-6 md:mb-10">
                                Who we are
                            </h2>

                            <div className="border-2 border-[#ffc107]/40 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-14 shadow-[0_4px_30px_rgba(0,0,0,0.45)]">
                                <div className="space-y-5 md:space-y-8 text-[0.95rem] md:text-[1.35rem] leading-relaxed text-left">
                                    <p className="font-semibold">
                                        <span className="font-bold font-manyto">Hive</span>
                                        <span className="text-[#f39c12] font-bold font-manyto">Zone</span> is a
                                        student-focused digital
                                        platform  designed to improve campus
                                        life.
                                        <br />
                                        We connect students within the same
                                        university to
                                    </p>

                                    <ul className="space-y-2 md:space-y-3">
                                        {[
                                            "Access ethical earning opportunities",
                                            "Collaborate academically",
                                            "Find safe peer support",
                                        ].map((item, index) => (
                                            <li key={index} className="flex gap-3 md:gap-4">
                                                <Image
                                                    src="/icons/rightarrow.svg"
                                                    alt="Arrow"
                                                    width={22}
                                                    height={22}
                                                    className="shrink-0 mt-0.5 invert md:w-7 md:h-7"
                                                />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <p className="font-semibold">
                                        We believe no students should struggle alone
                                        – academically, financially, or emotionally.
                                    </p>

                                    <p className="font-semibold">
                                        <span className="font-bold font-manyto">Hive</span>
                                        <span className="text-[#f39c12] font-bold font-manyto">Zone</span> is
                                        built as a secure, verified student-only ecosystem –
                                        starting small, growing intentionally, and scaling across
                                        universities.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Mission */}
                    <section className="w-full mb-10 md:mb-20">
                        <div className="max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-4xl font-bold font-manyto text-black text-center mb-4">
                                Our Mission
                            </h2>

                            {/* Mobile: card with astronaut on top, text below */}
                            <div className="md:hidden">
                                <div className="border-2 border-[#ffc107]/40 rounded-[2rem] p-6 flex flex-col items-center shadow-[0_4px_30px_rgba(0,0,0,0.12)]">
                                    <div className="relative w-[250px] h-[200px]">
                                        <Image
                                            src="/space.png"
                                            alt="Astronaut"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                    <div className="space-y-4 text-[0.95rem] font-medium text-zinc-800">
                                        <p>
                                            To eliminate academic isolation,
                                            reduce financial pressure, and
                                            create safe support systems for
                                            students across universities.
                                        </p>
                                        <p>
                                            We are building more than a website.
                                            <br />
                                            We are building a campus community
                                            <br />
                                            infrastructure.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop: side by side */}
                            <div className="hidden md:flex flex-col lg:flex-row items-center gap-12">
                                <div className="flex-1 space-y-6">                                    <div className="space-y-6 text-[1.25rem] font-medium text-zinc-800">
                                    <p>
                                        To eliminate academic isolation, reduce financial pressure, and
                                        create safe support systems for students across universities.
                                    </p>
                                    <p>
                                        We are building more than a website.
                                        <br />
                                        We are building a campus community
                                        <br />
                                        infrastructure.
                                    </p>
                                </div>
                                </div>

                                <div className="relative w-[380px] h-[500px] shrink-0">
                                    <Image
                                        src="/space.png"
                                        alt="Astronaut"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Problem */}
                    <section className="w-full mb-10 md:mb-20">
                        <div className="max-w-3xl mx-auto">
                            {/* Mobile layout */}
                            <div className="md:hidden">
                                <div className="border-2 border-[#ffc107]/40 rounded-[2rem] p-6 mb-6 shadow-[0_4px_30px_rgba(0,0,0,0.12)]">
                                    {/* Heading row: "The" + bee on same line, then "problem we saw" below */}
                                    <div className="flex items-center gap-2 mb-1 h-[3.2rem] overflow-visible">
                                        <h2 className="text-5xl font-bold font-manyto text-[#ffc107] uppercase leading-none">
                                            The
                                        </h2>
                                        <div className="relative w-[120px] h-[120px] shrink-0">
                                            <Image
                                                src="/bee.png"
                                                alt="Bee"
                                                fill
                                                className="object-contain grayscale"
                                            />
                                        </div>
                                    </div>
                                    <h2 className="text-5xl font-bold font-manyto text-[#ffc107] uppercase leading-none mb-6">
                                        problem
                                        <br />
                                        we saw
                                    </h2>

                                    <div className="space-y-4 text-[0.9rem] font-medium text-zinc-800">
                                        <p>
                                            Across universities - including University
                                            Of Ghana
                                            and Kwame Nkrumah University Of Science and
                                            Technology - students face three major
                                            challenges.
                                        </p>

                                        <p>Academic confusion and lack of collaboration</p>
                                        <p>Financial stress and limited ethical income options</p>
                                        <p>Silent emotional struggles without safe spaces</p>
                                    </div>
                                </div>

                                <p className="text-[#ffc107] font-bold text-lg">
                                    These problems exist everywhere, but most
                                    platforms ignore them
                                </p>
                            </div>

                            {/* Desktop layout */}
                            <div className="hidden md:block">
                                <div className="flex flex-row items-center gap-8 mb-12">
                                    <div className="relative w-[260px] aspect-[4/3] shrink-0">
                                        <Image
                                            src="/bee.png"
                                            alt="Bee"
                                            fill
                                            className="object-contain grayscale"
                                        />
                                    </div>

                                    <h2 className="text-5xl lg:text-7xl font-bold font-manyto text-[#ffc107] uppercase leading-none">
                                        The
                                        <br />
                                        problem
                                        <br />
                                        we saw
                                    </h2>
                                </div>

                                <div className="space-y-6 text-xl font-medium text-zinc-800">
                                    <p>
                                        Across universities - including University Of Ghana
                                        and Kwame Nkrumah University Of Science and
                                        Technology - students face three major challenges.
                                    </p>

                                    <p>Academic confusion and lack of collaboration</p>
                                    <p>Financial stress and limited ethical income options</p>
                                    <p>Silent emotional struggles without safe spaces</p>

                                    <p className="text-[#ffc107] font-bold">
                                        These problems exist everywhere, but most
                                        platforms ignore them
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Vision */}
                    <section className="w-full mb-16 md:mb-24 mt-8 md:mt-28">
                        <div className="max-w-3xl mx-auto">
                            <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 mb-6 md:mb-8">
                                <h2 className="text-5xl md:text-6xl font-bold font-manyto leading-none text-center">
                                    Our
                                    <br />
                                    Vision
                                </h2>
                                <div className="relative w-[160px] h-[90px] md:w-[220px] md:h-[120px]">
                                    <Image
                                        src="/glasses.svg"
                                        alt="Vision"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 md:space-y-6">
                                <p className="text-[1.05rem] md:text-[1.35rem] font-bold">
                                    To become the social operating system for universities
                                    - starting locally and expanding globally.
                                </p>

                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default AboutPage;