"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";

const ForgotPasswordPage = () => {
    const [identifier, setIdentifier] = useState("");

    return (
        <div className="min-h-screen bg-[#f1f1f1] text-zinc-900 font-sans flex flex-col items-center">
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
            <main className="flex-1 w-full flex flex-col items-center px-6 max-w-md mx-auto">
                {/* Hero Heading */}
                <div className="mb-6 mt-4 text-center">
                    <h1 className="text-4xl sm:text-5xl font-manyto leading-none">
                        <span className="text-black font-bold">Forgot Your</span>
                        <br />
                        <span className="text-[#ffc107] font-bold">Password</span>
                        <span className="text-black">?</span>
                    </h1>
                    <p className="mt-4 text-sm text-zinc-600">Enter your email or display name to reset your password.</p>
                </div>

                {/* Down Arrow */}
                <div className="mb-10 flex justify-center w-full">
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                        <Image
                            src="/icons/downarrow.svg"
                            alt="Down arrow"
                            width={20}
                            height={20}
                        />
                    </div>
                </div>

                {/* Form Card */}
                <div className="w-full border-2 border-[#ffc107]/40 rounded-3xl p-6 sm:p-8 space-y-6">
                    {/* Identifier */}
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-2 text-zinc-800">Email Or Public Display Name</label>
                        <input
                            type="text"
                            placeholder="example@gmail.com"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="w-full bg-[#ebebeb] border border-zinc-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#ffc107] transition-colors"
                        />
                    </div>
                </div>

                {/* Return Link */}
                <div className="w-full mt-6 text-center text-lg">
                    <span className="text-zinc-900">Remember your password? </span>
                    <Link href="/auth/signin" className="text-[#ffc107] font-semibold hover:underline">
                        Sign In
                    </Link>
                </div>

                {/* Send Reset Button */}
                <div className="w-full mt-6 mb-10">
                    <button className="w-full bg-[#ffc107] text-black text-xl py-4 flex items-center justify-center gap-3 hover:bg-[#ffca2c] transition-colors active:scale-[0.98]">
                        <Image
                            src="/icons/rightarrow.svg"
                            alt="Arrow"
                            width={24}
                            height={24}
                            className="invert"
                        />
                        <span>Send Reset Link</span>
                    </button>
                </div>
            </main>

            <div className="w-full mt-auto">
                <Footer />
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
