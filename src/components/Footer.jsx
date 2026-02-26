"use client";

import React from 'react';
import Image from 'next/image';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-black text-white px-7 py-4">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 flex justify-start">
                    <Image
                        src="/logoIcon.svg"
                        alt="HiveZone Icon"
                        width={30}
                        height={30}
                        className="h-8 w-auto"
                        priority
                    />
                </div>
                <div className="flex-1 flex justify-center text-gray-400 text-sm font-light">
                    <span>© {currentYear} HiveZone</span>
                </div>
                <div className="flex-1 flex justify-end gap-2 text-gray-400 text-sm font-light">
                    <a href="/about" className="hover:opacity-70 transition-opacity">About</a>
                    <a href="/privacy" className="hover:opacity-70 transition-opacity">Privacy</a>
                    <a href="/terms" className="hover:opacity-70 transition-opacity">Terms</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
