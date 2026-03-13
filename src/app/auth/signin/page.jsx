"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import { createClient } from "@/utils/supabase/client";

const SignInPage = () => {
    const router = useRouter();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showResend, setShowResend] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    const handleResendEmail = async () => {
        setResendLoading(true);
        const supabase = createClient();
        
        let emailToResend = identifier;
        if (!identifier.includes('@')) {
            const { data } = await supabase.from('users').select('email').ilike('username', identifier).single();
            if (data) emailToResend = data.email;
        }

        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: emailToResend.trim().toLowerCase(),
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            }
        });

        setResendLoading(false);
        if (error) {
            setError(error.message);
        } else {
            setResendSuccess(true);
            setShowResend(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setShowResend(false);
        setResendSuccess(false);

        if (!identifier || !password) {
            setError("Please fill in all fields.");
            return;
        }

        setLoading(true);
        const supabase = createClient();

        // Check if identifier is an email. If not, we might need to look up the email by username
        // For simplicity in V1, Supabase native Auth requires email.
        let emailToLogin = identifier;

        if (!identifier.includes('@')) {
            // It's a username. We need to find the email.
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('email')
                .ilike('username', identifier)
                .single();

            if (userError || !userData) {
                setError("Invalid username or password.");
                setLoading(false);
                return;
            }
            emailToLogin = userData.email;
        }

        const { error: authError } = await supabase.auth.signInWithPassword({
            email: emailToLogin,
            password,
        });

        if (authError) {
            if (authError.message.includes("Email not confirmed")) {
                setError("Please verify your email before signing in.");
                setShowResend(true);
            } else {
                setError(authError.message);
            }
            setLoading(false);
            return;
        }

        // Check if the user is onboarded and verified
        const { data: userRecord, error: recordError } = await supabase
            .from('users')
            .select('is_onboarded, email_verified')
            .eq('email', emailToLogin)
            .single();

        setLoading(false);

        if (userRecord) {
            if (!userRecord.email_verified) {
                // If Supabase allows login without verification but we want to enforce it via our field
                setError("Your email is not verified. Please check your inbox.");
                setShowResend(true);
                await supabase.auth.signOut();
                return;
            }

            if (!userRecord.is_onboarded) {
                router.push("/auth/onboarding");
            } else {
                // Route to the dashboard or home page
                router.push("/dashboard");
            }
        } else {
            // Fallback if record not found yet (trigger lag)
            router.push("/dashboard");
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
                <div className="mb-8 mt-4 text-center">
                    <h1 className="text-5xl sm:text-6xl font-bold font-manyto leading-none">
                        <span className="text-black">Move</span>
                        <br />
                        <span className="text-[#ffc107]">Into</span>
                        <span className="text-black">Your</span>
                        <span className="text-[#ffc107]">Hive</span>
                    </h1>
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
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl relative text-sm space-y-2" role="alert">
                            <span className="block">{error}</span>
                            {showResend && (
                                <button
                                    type="button"
                                    onClick={handleResendEmail}
                                    disabled={resendLoading}
                                    className="text-[#ffc107] font-bold hover:underline disabled:opacity-50"
                                >
                                    {resendLoading ? "Sending..." : "Resend Verification Email"}
                                </button>
                            )}
                        </div>
                    )}
                    {resendSuccess && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl relative text-sm" role="alert">
                            Verification email resent! Please check your inbox.
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
                            onKeyDown={(e) => handleKeyDown(e, handleSubmit)}
                            className="w-full bg-[#ebebeb] border border-zinc-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#ffc107] transition-colors"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-2 text-zinc-800">Enter Your Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, handleSubmit)}
                                className="w-full bg-[#ebebeb] border border-zinc-300 rounded-lg px-4 py-3 pr-10 text-sm outline-none focus:border-[#ffc107] transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-amber-500 focus:outline-none"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <div className="w-full mt-2 text-right">
                            <Link href="/auth/forgot-password" className="text-sm hover:underline">
                                Forgot Password?
                            </Link>
                        </div>
                    </div>
                </form>


                <div className="w-full max-w-md mt-4 text-center text-lg">
                    <span className="text-zinc-900">Don't have an account? </span>
                    <Link href="/auth/register" className="text-[#ffc107] font-semibold hover:underline">
                        Register
                    </Link>
                </div>

                {/* Step In Button */}
                <div className="w-full mt-8 mb-10">
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-[#ffc107] text-black font-semibold text-xl py-4 flex items-center justify-center gap-3 hover:bg-[#ffca2c] transition-colors active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
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
                        <span>{loading ? "Stepping In..." : "Step In"}</span>
                    </button>
                </div>
            </main>

            <div className="w-full mt-auto">
                <Footer />
            </div>
        </div>
    );
};

export default SignInPage;
