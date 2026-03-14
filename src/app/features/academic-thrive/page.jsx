"use client";

import React from "react";
import Image from "next/image";
import Footer from "@/components/Footer";
import SecondaryNavbar from "@/components/SecondaryNavbar";
import FeatureNavigation from "@/components/FeatureNavigation";

const AcademicThrivePage = () => {
    const problems = [
        { label: "Slow to understand lectures", raised: true, image: "/layout/slowman.png", scaleClass: "scale-[1.05]" },
        { label: "Missed announcements", raised: false, image: "/layout/forgot.png", scaleClass: "scale-[1.05]" },
        { label: "Don't know how to ask for help", raised: true, image: "/layout/help.png", scaleClass: "scale-[1.05]" },
        { label: "Study alone and struggle silently", raised: false, image: "/layout/struggle.png", scaleClass: "scale-[1.75] md:scale-[1.35]" },
    ];

    const studyCircleFeatures = [
        "Course-based group\nmatching",
        "Verified\nclassmates only",
        "Anonymous\nquestion\nposting",
        "Peer tutoring\nmatching",
    ];

    return (
        <div className="min-h-screen bg-[#fcf6de] text-zinc-900 font-sans overflow-x-clip flex flex-col">
            <SecondaryNavbar />

            <main className="flex-1">
                <div className="max-w-6xl mx-auto px-6 md:px-12 flex flex-col">

                    {/* Hero */}
                    <section className="w-full py-10 md:py-14">
                        <div className="relative flex flex-col md:flex-row md:items-center rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-[#ffc107]/15 min-h-[380px] md:min-h-[420px] lg:min-h-[500px]">
                            {/* Text content - Top left on mobile */}
                            <div className="relative z-10 px-8 pt-10 pb-4 md:px-14 lg:px-16 md:py-16 w-full md:max-w-[48%] flex-shrink-0">
                                <h1 className="font-manyto text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[7rem] leading-none tracking-tight">
                                    <span className="text-black">Academic</span>
                                    <br />
                                    <span className="text-[#ffc107]">Thrive</span>
                                </h1>
                            </div>

                            {/* Hero image - Bottom on mobile, right on desktop */}
                            <div className="relative md:absolute w-full h-[220px] md:h-full md:right-0 md:top-0 md:bottom-0 md:w-[55%] mt-auto md:mt-0">
                                <Image
                                    src="/stairs.png"
                                    alt="Climbing stairs"
                                    fill
                                    className="object-cover object-top md:object-center rounded-b-[2rem] md:rounded-[2.5rem]"
                                    style={{ mixBlendMode: 'multiply' }}
                                />
                            </div>
                        </div>
                    </section>

                    {/* The Problem */}
                    <section className="w-full py-10 md:py-16">
                        <h2 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-bold font-newyork text-black mb-12 md:mb-16 text-right md:text-left leading-tight">
                            The <span className="text-[#ffc107]">Problem</span><br /> <span className="text-black">With Students</span>
                        </h2>

                        {/* Cards - staggered layout */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-5 items-start">
                            {problems.map((problem, index) => (
                                <div
                                    key={index}
                                    className={`relative rounded-[2rem] bg-[#ffc107] overflow-hidden flex flex-col w-[90%] sm:w-full mx-auto 
                                        aspect-auto md:![aspect-ratio:294/565] min-h-[420px] md:min-h-0
                                        ${problem.raised
                                            ? "md:-mt-10 sm:mt-0 ml-auto sm:ml-0 mr-0 sm:mr-0"
                                            : "md:mt-10 sm:mt-0 mr-auto sm:mr-0 ml-0 sm:ml-0"
                                        }`}
                                    style={{
                                        boxShadow: "2px 4px 100px 1.5px rgba(0,0,0,0.25)",
                                    }}
                                >
                                    <div className="relative z-20 p-5 md:p-6">
                                        <p className="font-semibold text-black text-[clamp(1.2rem,2.5vw,1.25rem)] md:text-[clamp(0.85rem,1.8vw,1.2rem)] leading-snug">
                                            {problem.label}
                                        </p>
                                    </div>

                                    {/* Drip overlay background */}
                                    <svg
                                        viewBox="0 0 294 384"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="absolute bottom-0 left-0 w-full h-auto z-0"
                                        preserveAspectRatio="xMidYMax meet"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M0 123.995C0 85.1599 49.7653 69.1059 72.4594 100.62L160.364 222.687C181.623 252.208 228.057 240.324 232.521 204.22L239.936 144.243C241.447 132.018 251.004 122.344 263.211 120.685C279.499 118.471 294 131.134 294 147.572V343.5C294 365.591 276.091 383.5 254 383.5H40C17.9086 383.5 0 365.591 0 343.5V123.995Z"
                                            fill="#F9E3A2"
                                        />
                                    </svg>

                                    {/* Person image - pops out of the drip but stays inside the rounded card */}
                                    <div className="absolute bottom-0 left-0 w-full h-[60%] z-10 flex items-end pb-2">
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={problem.image}
                                                alt={problem.label}
                                                fill
                                                className={`object-contain object-bottom grayscale ${problem.scaleClass || 'scale-[1.05]'}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quote box */}
                        <div className="mt-14 md:mt-20 border-2 border-[#ffc107] rounded-[2rem] p-8 md:p-12 max-w-4xl mx-auto">
                            <p className="text-center text-black text-base md:text-xl lg:text-2xl leading-relaxed">
                                In large universities like University of Ghana or Kwame Nkrumah
                                University of Science and Technology, students easily feel lost.
                            </p>
                        </div>
                    </section>

                    {/* Introduction Statement - Glassmorphism */}
                    <section className="relative w-full flex flex-col items-center justify-center py-20 px-6 overflow-hidden">

                        {/* Ambient background glow */}
                        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_60%)]" />

                        {/* Main Glass Text Area */}
                        <div className="relative z-10 w-full max-w-xl overflow-hidden
                            bg-transparent
                            backdrop-blur-[20px]
                            [-webkit-backdrop-filter:blur(20px)]
                            rounded-[2.5rem]
                            px-6 md:px-14 lg:px-16
                            py-16 md:py-20 lg:py-24
                            flex flex-col items-center
                        ">
                            {/* Background image - centered and heavily blurred */}
                            <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
                                <div className="relative w-full h-[120%]">
                                    <Image
                                        src="/graduatecap.png"
                                        alt="Graduate cap"
                                        fill
                                        className="object-contain object-center scale-[0.8] opacity-50 blur-[25px] md:blur-[50px] transform-gpu"
                                    />
                                </div>
                            </div>

                            {/* Heavy, thick text from reference */}
                            <p className="relative z-10 font-manyto font-bold text-black text-[32px] md:text-[44px] lg:text-[56px] leading-[1.05] tracking-tight text-center">
                                Introducing a
                                <br />
                                comprehensive
                                <br />
                                system to
                                <br />
                                alleviate
                                <br />
                                academics
                            </p>

                            {/* Simple Outline Arrow Button */}
                            <div className="relative z-10 mt-10 md:mt-14">
                                <div className="w-14 h-14 md:w-16 md:h-16
                                    rounded-full
                                    border border-black
                                    flex items-center justify-center
                                    hover:scale-105
                                    transition-transform duration-300
                                    cursor-pointer
                                ">
                                    <Image
                                        src="/icons/downarrow.svg"
                                        alt="Down arrow"
                                        width={20}
                                        height={28}
                                        className="brightness-0 object-contain scale-90"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Feature Glass Bars */}
                        <div className="mt-12 md:mt-16 w-full max-w-xl space-y-4 md:space-y-6">
                            {studyCircleFeatures.map((feature, index) => (
                                <div
                                    key={index}
                                    className="
                                        w-full
                                        bg-white/10
                                        backdrop-blur-[20px]
                                        rounded-[1.5rem]
                                        px-6 py-5 md:px-8 md:py-6
                                        flex flex-col items-center justify-center
                                        shadow-[0_4px_30px_rgba(0,0,0,0.05)]
                                        hover:bg-white/20
                                        transition-all duration-300
                                    "
                                >
                                    <p className="text-black/90 font-medium text-base md:text-lg lg:text-xl leading-snug whitespace-pre-line text-center">
                                        {feature}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
                <FeatureNavigation
                    nextFeatureName="Campus Hustle"
                    nextFeaturePath="/features/campus-hustle"
                />
            </main>

            <Footer />
        </div>
    );
};

export default AcademicThrivePage;
