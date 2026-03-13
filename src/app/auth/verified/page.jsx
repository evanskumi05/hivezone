"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";

const VerifiedPage = () => {
    return (
        <div className="min-h-screen bg-[#f5f5f5] text-zinc-900 font-sans flex flex-col items-center">
            {/* Logo */}
            <div className="w-full flex justify-center pt-10 pb-6">
                <Link href="/" className="flex items-center">
                    <Image
                        src="/logo.svg"
                        alt="HiveZone Logo"
                        width={140}
                        height={40}
                        className="h-10 w-auto"
                        priority
                    />
                </Link>
            </div>

            {/* Main Content */}
            <main className="flex-1 w-full flex flex-col items-center justify-center px-6 max-w-md mx-auto">
                <div className="w-full bg-white border-2 border-[#ffc107]/40 rounded-[2.5rem] p-10 text-center space-y-8 shadow-sm">
                    {/* Success Icon */}
                    <div className="w-24 h-24 bg-[#ffc107] rounded-full flex items-center justify-center mx-auto shadow-lg shadow-[#ffc107]/20">
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth={3} 
                            stroke="black" 
                            className="w-12 h-12"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold font-manyto leading-tight">
                            Email
                            <br />
                            <span className="text-[#ffc107]">Verified!</span>
                        </h1>
                        <p className="text-zinc-500 font-medium">
                            Your account is now fully active. You're ready to explore the hive and connect with your campus.
                        </p>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4">
                        <Link 
                            href="/auth/signin" 
                            className="w-full bg-[#ffc107] text-black font-bold text-xl py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#ffca2c] transition-all active:scale-[0.98] shadow-md shadow-[#ffc107]/10"
                        >
                            <span>Sign In to Your Account</span>
                            <Image
                                src="/icons/rightarrow.svg"
                                alt="Arrow"
                                width={24}
                                height={24}
                                className="invert"
                            />
                        </Link>
                    </div>
                </div>

                {/* Supportive Text */}
                <p className="mt-8 text-zinc-400 text-sm font-medium">
                    Welcome to the community, hero!
                </p>
            </main>

            <div className="w-full mt-auto">
                <Footer />
            </div>
        </div>
    );
};

export default VerifiedPage;
