"use client";

import React from "react";
import Image from "next/image";
import Footer from "@/components/Footer";
import SecondaryNavbar from "@/components/SecondaryNavbar";
import FeatureNavigation from "@/components/FeatureNavigation";

const CampusHustlePage = () => {
    const solutions = [
        { title: "Scholarship alerts" },
        { title: "Verified internship listings" },
        { title: "Skill marketplace (students hire students)" },
        { title: "Micro-jobs posted by students (design, coding, tutoring)" },
    ];

    const problems = [
        "They struggle with fees",
        "Need small jobs",
        "Don't know legit opportunities",
        "Fall into betting traps (very common on campus)",
    ];

    return (
        <div className="min-h-screen bg-[#f9e3a2] text-zinc-900 font-sans overflow-x-clip flex flex-col">
            <SecondaryNavbar />

            <main className="flex-1">
                <div className="max-w-6xl mx-auto px-6 md:px-12 flex flex-col">

                    {/* Sub Header */}
                    <section className="w-full pt-6 pb-2 text-center">
                        <p className="font-manyto text-xl md:text-2xl lg:text-3xl font-semibold tracking-wide">
                            <span className="text-black">Campus </span>
                            <span className="text-[#ffc107]">Hustle</span>
                        </p>
                    </section>

                    {/* Hero */}
                    <section className="w-full py-6 md:py-10 text-center">
                        <h1 className="font-manyto font-bold leading-none tracking-tight">
                            <span className="block text-black text-4xl md:text-6xl lg:text-[80px]">From</span>
                            <span className="block text-[#ffc107] text-4xl md:text-6xl lg:text-[80px]">Classroom</span>
                            <span className="block text-black text-4xl md:text-6xl lg:text-[80px]">To</span>
                            <span className="block text-[#ffc107] text-4xl md:text-6xl lg:text-[80px]">Cashflow</span>
                        </h1>
                    </section>

                    {/* Campus Opportunities Board */}
                    <section className="w-full py-8 md:py-12">
                        {/* Campus Opportunities Board */}
                        <div className="relative w-full rounded-[2.5rem] md:rounded-[3rem] bg-[#f2dfa4] shadow-[0_4px_30px_rgba(0,0,0,0.05)] overflow-hidden aspect-[4/3] sm:aspect-[16/9] md:aspect-[2.2/1] flex flex-col items-center justify-start">
                            {/* The "money tree" image, centered at the top taking up most of the space */}
                            <div className="absolute inset-x-0 -top-4 h-[55%] md:h-[65%] w-full flex justify-center z-10 pointer-events-none">
                                <Image
                                    src="/moneytree.png"
                                    alt="Make money ethically on campus"
                                    fill
                                    className="object-contain object-top"
                                />
                            </div>

                            {/* Semi-transparent beige/cream swoosh overlay at the bottom */}
                            <svg
                                viewBox="0 0 1000 300"
                                preserveAspectRatio="none"
                                className="absolute bottom-0 left-0 w-full h-[45%] md:h-[55%] z-0"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M0 100 Q 300 0 1000 150 L 1000 300 L 0 300 Z"
                                    fill="rgba(219, 196, 128, 0.4)"
                                />
                            </svg>

                            {/* Text positioned at the bottom-left over the SVG */}
                            <div className="absolute bottom-0 sm:bottom-2 md:bottom-10 left-6 md:left-12 lg:left-16 z-20">
                                <p className="font-medium text-[1.1rem] sm:text-2xl md:text-3xl lg:text-4xl leading-snug">
                                    <span className="text-black">Make money</span>
                                    <br />
                                    <span className="bg-black text-[#ffc107] px-2 py-0.5 inline-block my-1 md:my-1.5 leading-none">ethically</span>
                                    <br />
                                    <span className="text-black">on campus</span>
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Description Section */}
                    <section className="w-full py-8 md:py-12">
                        {/* Amber top divider */}
                        <div className="h-px bg-gradient-to-r from-[rgba(255,193,7,0.35)] to-[rgba(0,0,0,0.35)] mb-8" />

                        {/* Description with left border */}
                        <div className="border-l-4 border-[#ffc107] pl-6 md:pl-10">
                            <p className="font-light text-black text-base md:text-xl lg:text-2xl leading-relaxed">
                                Ethical earning on campus allows students to build financial independence while
                                upholding academic integrity and community values. By leveraging their unique
                                skills—such as peer tutoring, freelance graphic design, or managing social media
                                for local campus organisations—students can provide genuine value to their peers
                                and lecturers. Platform like{" "}
                                <span className="font-manyto font-bold text-[#ffc107]">Hive</span>
                                <span className="font-newyork font-bold text-black">Zone</span>
                                {" "}facilitate this journey &quot;from classroom to cashflow&quot; by turning lecture notes
                                and academic insights into valuable resources, ensuring that every cedi earned
                                is a reflection of hard work, knowledge sharing, and professional growth within
                                the university ecosystem.
                            </p>
                        </div>
                    </section>


                    {/* The Ideal Problem */}
                    <section className="w-full py-8 md:py-14">
                        {/* Section heading */}
                        <h2 className="font-manyto font-bold text-4xl md:text-5xl lg:text-[64px] leading-none mb-8 md:mb-12">
                            <span className="text-black">The </span>
                            <span className="text-[#ffc107]">Ideal</span>
                            <br />
                            <span className="text-black">Problem</span>
                        </h2>

                        {/* Black card with image and text */}
                        <div className="bg-black rounded-2xl md:rounded-3xl shadow-[0_4px_100px_0_rgba(0,0,0,0.25)] overflow-hidden mb-8 md:mb-12">
                            <div className="flex flex-col md:flex-row items-center min-h-[240px] md:min-h-[320px]">
                                {/* Text */}
                                <div className="p-8 md:p-12 flex-shrink-0 md:w-2/5">
                                    <p className="font-medium text-white text-2xl md:text-4xl lg:text-5xl leading-tight">
                                        Students<br />feel<br />financial<br />pressure
                                    </p>
                                </div>
                                {/* Image */}
                                <div className="flex-1 flex items-center justify-center p-4 md:p-0">
                                    <Image
                                        src="/financial-pressure.png"
                                        alt="Financial pressure illustration"
                                        width={1074}
                                        height={400}
                                        className="w-full max-w-md md:max-w-full h-60 md:h-80 lg:h-[400px] object-contain"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Problem list */}
                        <ul className="space-y-0">
                            {problems.map((problem, index) => (
                                <li key={index} className="border-b border-black py-3 md:py-5">
                                    <p className="font-normal text-black text-xl md:text-3xl lg:text-4xl leading-tight">
                                        {problem}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* The Solution */}
                    <section className="w-full py-8 md:py-14">
                        {/* Section heading */}
                        <h2 className="font-manyto font-bold text-4xl md:text-5xl lg:text-[64px] leading-none mb-8 md:mb-12">
                            <span className="text-black">The</span>
                            <br />
                            <span className="text-[#ffc107]">Solution</span>
                        </h2>

                        {/* Black card */}
                        <div className="bg-black rounded-2xl md:rounded-3xl shadow-[0_4px_100px_0_rgba(0,0,0,0.25)] overflow-hidden relative">
                            {/* Solutions grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-6 md:p-10 lg:p-12 pb-0 relative z-10">
                                {solutions.map((solution, index) => (
                                    <div key={index} className={index === 3 ? "sm:col-span-1 lg:col-start-2" : ""}>
                                        <p className="font-semibold text-white text-xl md:text-2xl lg:text-3xl leading-snug">
                                            {solution.title}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Yellow triangle shape + image overlay */}
                            <div className="relative mt-8 md:mt-12">
                                {/* Yellow triangle SVG */}
                                <svg
                                    viewBox="0 0 1321 872"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-full h-auto"
                                    preserveAspectRatio="none"
                                >
                                    <path
                                        d="M1321 872H0V0L279.5 211.5L645.5 268.5L1001.5 211.5L1321 0V872Z"
                                        fill="#ffc107"
                                    />
                                </svg>

                                {/* Case study image on top of triangle */}
                                <div className="absolute inset-0 flex items-center justify-center px-4">
                                    <Image
                                        src="/campus-hustle.png"
                                        alt="Campus hustle"
                                        width={2498}
                                        height={872}
                                        className="w-full max-w-2xl object-contain"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
                <FeatureNavigation
                    nextFeatureName="Mental Alleviation"
                    nextFeaturePath="/features/mental-alleviation"
                />
            </main>

            <Footer />
        </div>
    );
};

export default CampusHustlePage;
