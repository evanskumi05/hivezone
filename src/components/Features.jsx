"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

const FeatureCard = ({ title, items, href }) => {
    return (
        <div className="bg-zinc-50 border-[3px] border-[#ffc107] rounded-xl p-6 md:p-8 flex flex-col justify-between min-h-[280px] md:min-h-[380px] w-full max-w-[340px] shadow-[0_4px_40px_rgba(0,0,0,0.35)] md:shadow-[0_0_80px_10px_rgba(0,0,0,0.30)] relative overflow-hidden group">
            <div>
                <h3 className="text-3xl md:text-4xl font-semibold text-black mb-6 md:mb-8">
                    {title.split(' ').map((word, i) => (
                        <React.Fragment key={i}>
                            {word}
                            <br />
                        </React.Fragment>
                    ))}
                </h3>
                <ul className="space-y-2">
                    {items.map((item, index) => (
                        <li key={index} className="text-zinc-600 text-lg">
                            {item}
                        </li>
                    ))}
                </ul>
            </div>

            <a href={href} className="absolute bottom-6 right-6">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-[#2c2c2c] rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                    <Image
                        src="/icons/45arrow.svg"
                        alt="Arrow"
                        width={16}
                        height={16}
                        className="md:w-6 md:h-6"
                    />
                </div>
            </a>
        </div>
    );
};

const Features = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef(null);

    const features = [
        {
            title: "Academic Thrive",
            items: ["Peer tutoring matching", "Course-based group matching"],
            href: "/features/academic-thrive"
        },
        {
            title: "Campus Hustle",
            items: ["Local Campus gigs", "Verified internship listings"],
            href: "/features/campus-hustle"
        },
        {
            title: "Mental Alleviation",
            items: ["Daily motion feed", "Anonymous chat rooms"],
            href: "/features/mental-alleviation"
        }
    ];

    // Track active slide via scroll position
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollLeft = container.scrollLeft;
            const cardWidth = container.offsetWidth;
            const index = Math.round(scrollLeft / cardWidth);
            setActiveIndex(index);
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollTo = (index) => {
        const container = scrollRef.current;
        if (!container) return;
        container.scrollTo({ left: index * container.offsetWidth, behavior: 'smooth' });
    };

    return (
        <section className="w-full py-8 md:py-24 px-8 flex flex-col items-center">
            <h2 className="text-4xl md:text-6xl font-bold text-black mb-16 font-manyto text-center">
                Turn Confusions Into Collaborations
            </h2>

            {/* Desktop: grid */}
            <div className="hidden md:grid grid-cols-3 gap-8 w-full max-w-7xl px-4 justify-items-center">
                {features.map((feature, index) => (
                    <FeatureCard key={index} {...feature} />
                ))}
            </div>

            {/* Mobile: slideshow */}
            <div className="md:hidden w-full flex flex-col items-center overflow-visible">
                <div
                    ref={scrollRef}
                    className="w-full flex overflow-x-auto overflow-y-visible snap-x snap-mandatory py-10"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                    <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="w-[85%] flex-shrink-0 snap-center snap-always flex justify-center px-4 first:ml-[7.5%] last:mr-[7.5%]"
                        >
                            <FeatureCard {...feature} />
                        </div>
                    ))}
                </div>

                {/* Dot indicators */}
                <div className="flex gap-2.5 mt-8">
                    {features.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => scrollTo(index)}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === activeIndex
                                ? 'bg-[#ffc107]'
                                : 'bg-zinc-300'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
