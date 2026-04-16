"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

const SecondaryNavbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const pathname = usePathname();

    const scrollToTop = (e) => {
        if (isScrolled) {
            e.preventDefault();
            
            // IF ON DASHBOARD: Use custom event to resolve the 'Glitch' conflict
            if (pathname === '/dashboard') {
                window.dispatchEvent(new CustomEvent('HZ_NAV_LOGO_CLICK'));
            } else {
                window.scrollTo({ top: 0, behavior: "auto" });
            }
        }
    };

    return (
        <nav className={`w-full px-8 py-6 sticky top-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-[#fcf6de]/80 backdrop-blur-md py-4 shadow-sm' : 'bg-[#fcf6de]'}`}>
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

                {/* Register Link */}
                <AnimatePresence mode="wait">
                    {!isScrolled && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="ml-auto"
                        >
                            <a
                                href="/auth/register"
                                className="relative text-black font-semibold after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-black after:transition-all after:duration-300 hover:after:w-full"
                            >
                                Register
                            </a>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
            {/* Gradient Separator Line */}
            <div className={`absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#ffc104] via-black/10 to-black transition-opacity duration-500 ${isScrolled ? 'opacity-20' : 'opacity-40'}`} />
        </nav>
    );
};

export default SecondaryNavbar;
