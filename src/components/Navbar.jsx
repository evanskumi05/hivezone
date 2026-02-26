"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = (e) => {
        if (isScrolled) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    return (
        <nav className={`w-full px-8 py-6 sticky top-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-white/80 backdrop-blur-md py-4 shadow-sm' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto relative flex items-center min-h-[40px]">

                {/* Logo Container */}
                <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 200, damping: 30 }}
                    className={`flex items-center z-10 ${isScrolled ? 'absolute left-1/2 -translate-x-1/2' : 'relative'}`}
                >
                    <a
                        href="/"
                        onClick={scrollToTop}
                        className={`flex items-center transition-transform ${isScrolled ? 'cursor-pointer hover:scale-105' : ''}`}
                    >
                        {/* Mobile: icon when stagnant, full logo when scrolled */}
                        <Image
                            src="/logoIcon.svg"
                            alt="HiveZone Logo"
                            width={40}
                            height={40}
                            className={`h-10 w-auto md:hidden ${isScrolled ? 'hidden' : 'block'}`}
                            priority
                        />
                        <Image
                            src="/logo.svg"
                            alt="HiveZone Logo"
                            width={100}
                            height={100}
                            className={`h-10 w-auto ${isScrolled ? 'block' : 'hidden md:block'}`}
                            priority
                        />
                    </a>
                </motion.div>

                {/* Navigation Links */}
                <AnimatePresence mode="wait">
                    {!isScrolled && (
                        <>
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="hidden md:block absolute left-1/2 -translate-x-1/2"
                            >
                                <a
                                    href="/about"
                                    className="relative text-black font-semibold after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-black after:transition-all after:duration-300 hover:after:w-full"
                                >
                                    About
                                </a>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                                className="ml-auto"
                            >
                                <a
                                    href="/auth/register"
                                    className="bg-black text-white px-4 py-2 hover:bg-zinc-800 transition-colors font-semibold shadow-sm"
                                >
                                    Register
                                </a>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

            </div>
            {/* Gradient Separator Line */}
            <div className={`absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#ffc104] via-black/10 to-black transition-opacity duration-500 ${isScrolled ? 'opacity-20' : 'opacity-40'}`} />
        </nav>
    );
};

export default Navbar;