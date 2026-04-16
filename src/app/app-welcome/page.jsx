"use client";

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const slides = [
    {
        id: 1,
        title: (
            <>
                <span className="font-newyork font-semibold text-[0.85em]">Join The</span>{' '}
                <span className="text-[#ffc107] font-newyork font-semibold">Only</span> 
                <br /> 
                <span className="text-[#ffc107] font-newyork font-semibold">Student Social</span>{' '}
                <span className="font-newyork font-semibold text-[0.85em]">Platform</span>
            </>
        ),
        description: "Get posted with a healthy and buzzing\nreal - time campus feeds",
        image: "/welcome/welcome-social.png",
    },
    {
        id: 2,
        title: (
            <>
                <span className="font-newyork font-semibold text-[0.85em]">Earn</span>{' '}
                <span className="text-[#ffc107] font-newyork font-semibold">Money</span>{' '}
                <span className="font-newyork font-semibold text-[0.85em]">Without</span>
                <br /> 
                <span className="font-newyork font-semibold text-[0.85em]">Leaving Campus</span>
            </>
        ),
        description: "Book gigs and own a marketplace\non campus. Get paid at a\nseemingly viable rate.",
        image: "/welcome/welcome-money.png",
    },
    {
        id: 3,
        title: (
            <>
                <span className="font-newyork font-semibold text-[0.85em]">Your</span>{' '}
                <span className="text-[#ffc107] font-newyork font-semibold">Mental Health</span> 
                <br /> 
                <span className="font-newyork font-semibold text-[0.85em]">Matters</span>
            </>
        ),
        description: "Student life is hard. You do not have to pretend it isn't. Your mental health matters as much as your GPA.",
        image: "/welcome/welcome-health.png",
    }
];

const variants = {
    enter: (direction) => ({
        x: direction > 0 ? 300 : -300,
        opacity: 0,
        scale: 0.95
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
        scale: 1
    },
    exit: (direction) => ({
        zIndex: 0,
        x: direction < 0 ? 300 : -300,
        opacity: 0,
        scale: 0.95
    })
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
};

export default function AppWelcomePage() {
    const [[page, direction], setPage] = useState([0, 0]);
    const router = useRouter();

    const currentSlide = page;

    const paginate = (newDirection) => {
        const nextSlide = page + newDirection;
        if (nextSlide >= 0 && nextSlide < slides.length) {
            setPage([nextSlide, newDirection]);
        } else if (nextSlide === slides.length) {
            router.push('/auth/register');
        }
    };

    const handleSkip = () => {
        router.push('/auth/register');
    };

    return (
        <div className="min-h-screen bg-[#F5F1E5] flex flex-col relative overflow-hidden font-sans touch-none">
            {/* Top Bar */}
            <div className="flex justify-end p-6 z-20">
                <button 
                    onClick={handleSkip}
                    className="flex items-center gap-2 text-gray-800 font-bold hover:opacity-70 transition-opacity px-2 py-2 rounded-full active:scale-95 group"
                >
                    <span className="text-sm">Skip</span>
                    <div className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center transition-transform group-hover:translate-x-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </div>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col items-center px-6 relative pt-4 overflow-hidden">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={page}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 },
                            scale: { duration: 0.2 }
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipe = swipePower(offset.x, velocity.x);

                            if (swipe < -swipeConfidenceThreshold) {
                                paginate(1);
                            } else if (swipe > swipeConfidenceThreshold) {
                                paginate(-1);
                            }
                        }}
                        className="w-full flex flex-col items-center text-center cursor-grab active:cursor-grabbing"
                    >
                        {/* Heading */}
                        <h1 className="text-[2.2rem] leading-[1.1] font-semibold text-gray-900 mb-4 font-newyork tracking-normal min-h-[5rem] text-center whitespace-pre-line pointer-events-none">
                            {slides[currentSlide].title}
                        </h1>

                        {/* Description */}
                        <p className="text-gray-800 text-[1.05rem] leading-snug font-medium mb-10 max-w-[320px] whitespace-pre-line opacity-90 pointer-events-none">
                            {slides[currentSlide].description}
                        </p>

                        {/* Image Container */}
                        <motion.div 
                            initial={{ y: 0 }}
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="relative w-full aspect-square max-w-[300px] flex items-center justify-center -mt-4 pointer-events-none"
                        >
                            <Image
                                src={slides[currentSlide].image}
                                alt="Onboarding illustration"
                                width={380}
                                height={380}
                                className="object-contain"
                                priority
                            />
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Bar */}
            <div className="p-8 pb-20 flex flex-col items-center gap-8">
                {/* Progress Indicators */}
                <div className="flex gap-2">
                    {slides.map((_, index) => (
                        <button 
                            key={index}
                            onClick={() => setPage([index, index > currentSlide ? 1 : -1])}
                            className={`h-2 rounded-full transition-all duration-300 ${
                                index === currentSlide ? 'w-4 bg-gray-900' : 'w-2 bg-gray-300'
                            }`}
                        />
                    ))}
                </div>

                {/* Main Button */}
                <button
                    onClick={() => paginate(1)}
                    className="w-full max-w-[280px] bg-black text-white py-3.5 rounded-xl font-bold text-lg transition-all active:scale-95 shadow-lg shadow-black/5"
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
