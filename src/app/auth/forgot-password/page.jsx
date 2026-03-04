"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";
import { createClient } from "@/utils/supabase/client";

const ForgotPasswordPage = () => {
    const [identifier, setIdentifier] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (error || success) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [error, success]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!identifier) {
            setError("Please enter your email.");
            return;
        }

        setLoading(true);
        const supabase = createClient();

        // Check if identifier is an email. If not, we might need to look up the email by username
        let emailToReset = identifier;

        if (!identifier.includes('@')) {
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('email')
                .ilike('username', identifier)
                .single();

            if (userError || !userData) {
                setError("Could not find an account with that username.");
                setLoading(false);
                return;
            }
            emailToReset = userData.email;
        }

        const { error: authError } = await supabase.auth.resetPasswordForEmail(emailToReset, {
            redirectTo: `${window.location.origin}/auth/update-password`,
        });

        setLoading(false);

        if (authError) {
            setError(authError.message);
        } else {
            setSuccess(true);
        }
    };

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
                    <p className="mt-4 text-sm text-zinc-600">Enter your email or username to reset your password.</p>
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
                <form onSubmit={handleSubmit} className="w-full border-2 border-[#ffc107]/40 rounded-3xl p-6 sm:p-8 space-y-6">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-sm" role="alert">
                            <span className="block sm:inline">Password reset link sent! Check your email.</span>
                        </div>
                    )}
                    {/* Identifier */}
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-2 text-zinc-800">Email Or Username</label>
                        <input
                            type="text"
                            placeholder="example@gmail.com"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="w-full bg-[#ebebeb] border border-zinc-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#ffc107] transition-colors"
                        />
                    </div>
                </form>

                {/* Return Link */}
                <div className="w-full mt-6 text-center text-lg">
                    <span className="text-zinc-900">Remember your password? </span>
                    <Link href="/auth/signin" className="text-[#ffc107] font-semibold hover:underline">
                        Sign In
                    </Link>
                </div>

                {/* Send Reset Button */}
                <div className="w-full mt-6 mb-10">
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-[#ffc107] text-black text-xl py-4 flex items-center justify-center gap-3 hover:bg-[#ffca2c] transition-colors active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <Image
                                src="/icons/rightarrow.svg"
                                alt="Arrow"
                                width={24}
                                height={24}
                                className="invert"
                            />
                        )}
                        <span>{loading ? "Sending..." : "Send Reset Link"}</span>
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
