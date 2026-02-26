"use client";

import React from "react";
import Image from "next/image";
import Footer from "@/components/Footer";
import SecondaryNavbar from "@/components/SecondaryNavbar";
import FeatureNavigation from "@/components/FeatureNavigation";

const MentalAlleviationPage = () => {
    const chatTopics = [
        "Breakups",
        "Academic stress",
        "Financial anxiety",
        "and more...",
    ];

    return (
        <div className="min-h-screen bg-[#f9e3a2] text-zinc-900 font-sans overflow-x-clip flex flex-col">
            <SecondaryNavbar />

            <main className="flex-1">
                <div className="max-w-6xl mx-auto px-6 md:px-12 flex flex-col">

                    {/* Hero */}
                    <section className="w-full py-8 md:py-18">
                        <div className="flex flex-col md:flex-row items-center gap-0 md:gap-2 justify-center">
                            <h1 className="font-manyto text-6xl sm:text-[5rem] md:text-6xl lg:text-7xl leading-[1.1] tracking-tight shrink-0 -mt-6 md:-mt-32 ml-4 md:ml-12 text-center md:text-left">
                                <span className="text-black">Mental</span>
                                <br />
                                <span className="text-[#ffc107]">Alleviation</span>
                            </h1>
                            <div className="relative w-[230px] h-[250px] sm:w-[280px] sm:h-[300px] md:w-[300px] md:h-[340px] -ml-2 -mt-4 md:mt-0">
                                <Image
                                    src="/brain.png"
                                    alt="Brain lifting weights"
                                    fill
                                    className="object-contain object-center md:object-left grayscale"
                                />
                            </div>
                        </div>
                    </section>

                    {/* The Silent Suffering badge */}
                    <section className="w-full flex justify-center py-6 md:py-2">
                        <div className="bg-zinc-900 text-white px-8 py-3 md:px-18 md:py-4">
                            <p className="text-sm md:text-lg font-semibold tracking-wide text-center">
                                The Silent Suffering
                            </p>
                        </div>
                    </section>

                    {/* Problem tags */}
                    <section className="w-full py-4 md:py-6 text-center">
                        <p className="text-base md:text-3xl font-semibold">
                            <span className="font-newyork text-black">Break</span><span className="text-[#ffc107] font-manyto">ups</span>
                            <span className="font-newyork text-black">. Academic </span>
                            <span className="font-newyork text-[#ffc107]">pressure</span>
                            <span className="font-newyork text-black">. Family </span>
                            <span className="font-newyork text-[#ffc107]">expectations</span>
                        </p>
                    </section>

                    {/* Quote card */}
                    <section className="w-full pt-12 pb-6 md:pt-22 md:pb-10 flex justify-center">
                        <div className="bg-black p-8 md:p-12 w-[85%] md:w-[70%]">
                            <p className="text-lg md:text-3xl text-white leading-relaxed">
                                Many students
                                <br />
                                don&apos;t want to see a counsellor,
                                <br />
                                don&apos;t trust friends
                                <br />
                                and
                                <br />
                                feel alone.
                            </p>
                        </div>
                    </section>

                    {/* Solution Section */}
                    <section className="w-full py-14 md:py-22 flex justify-center">
                        <div className="w-[95%] sm:w-[85%] md:w-[70%] flex flex-row gap-4 md:gap-8 items-center">
                            {/* Dark card */}
                            <div className="bg-black text-white p-4 sm:p-6 md:p-8 flex flex-col justify-center aspect-square w-[130px] sm:w-[150px] md:w-[220px] shrink-0">
                                <p className="text-xl sm:text-2xl md:text-3xl leading-snug">
                                    What&apos;s
                                    <br />
                                    the
                                    <br />
                                    solution
                                    <br />
                                    now?
                                </p>
                            </div>

                            {/* Answer */}
                            <div className="flex-1 flex items-center pr-2">
                                <h2 className="text-[1.44rem] sm:text-2xl md:text-4xl lg:text-5xl font-bold text-black leading-[1.05] md:leading-tight">
                                    <span className="font-manyto">Hive</span>
                                    <span className="font-manyto text-[#ffc107]">Zone</span>
                                    {" "}has an In-built
                                    <br />
                                    anonymous
                                    <br />
                                    support rooms
                                </h2>
                            </div>
                        </div>
                    </section>

                    {/* Chat Rooms by topic */}
                    <section className="w-full py-8 md:py-12 flex justify-center">
                        <div className="w-[85%] md:w-[70%]">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8">
                                <span className="text-black font-newyork">Chat</span><br />
                                <span className="font-newyork text-[#ffc107]">Rooms</span>
                                <span className="text-black font-newyork"> by topic:</span>
                            </h2>

                            <div className="space-y-3 md:space-y-4 mb-4">
                                {chatTopics.map((topic, index) => (
                                    <p
                                        key={index}
                                        className={`text-lg md:text-2xl ${topic === "and more..."
                                            ? "text-black font-normal"
                                            : "text-black font-medium underline decoration-[#2c2c2c] decoration-2 underline-offset-4"
                                            }`}
                                    >
                                        {topic}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Feature Cards */}
                    <section className="w-full py-6 md:py-10 flex justify-center">
                        <div className="w-[85%] md:w-[70%] space-y-6 md:space-y-8">
                            {/* AI-guided reflection prompts */}
                            <div className="rounded-[2rem] bg-[#f0ce5e] p-6 md:p-8 min-h-[260px] md:min-h-[340px] flex flex-col items-center justify-between">
                                <div className="relative w-[70%] aspect-[4/3] rounded-[1.5rem] overflow-hidden mb-4">
                                    <Image
                                        src="/aiphone.png"
                                        alt="AI-guided reflection prompts"
                                        fill
                                        className="object-contain opacity-60"
                                    />
                                </div>
                                <p className="text-lg md:text-2xl font-light text-black lead self-start">
                                    AI-guided
                                    <br />
                                    reflection prompts
                                </p>
                            </div>

                            {/* Daily motion feed */}
                            <div className="rounded-[2rem] bg-[#f0ce5e] p-6 md:p-8 min-h-[260px] md:min-h-[340px] flex flex-col items-center justify-between">
                                <div className="relative w-[70%] aspect-[4/3] rounded-[1.5rem] overflow-hidden mb-4">
                                    <Image
                                        src="/aiphone.png"
                                        alt="Daily motion feed"
                                        fill
                                        className="object-contain opacity-60"
                                    />
                                </div>
                                <p className="text-lg md:text-2xl font-light text-black leading-snug self-start">
                                    Daily
                                    <br />
                                    motion feed
                                </p>
                            </div>

                            {/* Peer support moderators */}
                            <div className="rounded-[2rem] bg-[#f0ce5e] p-6 md:p-8 min-h-[260px] md:min-h-[340px] flex flex-col items-center justify-between">
                                <div className="relative w-[70%] aspect-[4/3] rounded-[1.5rem] overflow-hidden mb-4">
                                    <Image
                                        src="/aiphone.png"
                                        alt="Peer support moderators"
                                        fill
                                        className="object-contain opacity-60"
                                    />
                                </div>
                                <p className="text-lg md:text-2xl font-light text-black leading-snug self-start">
                                    Peer
                                    <br />
                                    support moderators
                                </p>
                            </div>
                        </div>
                    </section>

                </div>
                <FeatureNavigation
                    nextFeatureName="Academic Thrive"
                    nextFeaturePath="/features/academic-thrive"
                />
            </main>

            <Footer />
        </div>
    );
};

export default MentalAlleviationPage;
