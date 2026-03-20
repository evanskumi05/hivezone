"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import { createClient } from "@/utils/supabase/client";
import { validateName, validateUsername, validateEmail, validatePassword } from "@/utils/validation";

const RegisterPage = () => {
    const router = useRouter();
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Form fields
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isEmailSent, setIsEmailSent] = useState(false);

    useEffect(() => {
        if (error) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [error]);

    useEffect(() => {
        const checkSession = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.push("/dashboard");
            }
        };
        checkSession();
    }, [router]);

    const handleKeyDown = (e, callback) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            callback(e);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Sanitize inputs
        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanUsername = username.trim().toLowerCase();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanFirstName || !cleanLastName || !cleanUsername || !cleanEmail || !password) {
            setError("Please fill in all fields.");
            return;
        }

        const firstNameError = validateName(cleanFirstName, "First name");
        if (firstNameError) { setError(firstNameError); return; }

        const lastNameError = validateName(cleanLastName, "Last name");
        if (lastNameError) { setError(lastNameError); return; }

        const usernameError = validateUsername(cleanUsername);
        if (usernameError) { setError(usernameError); return; }

        const emailError = validateEmail(cleanEmail);
        if (emailError) { setError(emailError); return; }

        const passwordError = validatePassword(password);
        if (passwordError) { setError(passwordError); return; }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (!agreeToTerms) {
            setError("You must agree to the Terms of Service and Privacy Policy.");
            return;
        }

        setLoading(true);
        const supabase = createClient();

        // 0. Pre-check for unique username and email securely via RPC
        const { data: existsData, error: checkError } = await supabase
            .rpc('check_user_exists', {
                p_username: cleanUsername,
                p_email: cleanEmail
            });

        if (checkError) {
            console.error("Error checking existing user:", checkError);
            setError("Trouble validating information. Please try again.");
            setLoading(false);
            return;
        }

        if (existsData) {
            if (existsData.username_exists) {
                setError("This username is already taken. Please choose another.");
                setLoading(false);
                return;
            }
            if (existsData.email_exists) {
                setError("An account with this email already exists. Try signing in.");
                setLoading(false);
                return;
            }
        }

        // 1. Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                data: {
                    first_name: cleanFirstName,
                    last_name: cleanLastName,
                    username: cleanUsername,
                }
            }
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        // Note: The database trigger handles the initial creation of the public.users record.

        setLoading(false);

        // Redirect to onboarding immediately so they can fill their info
        // while the verification email is being sent/waiting in their inbox.
        router.push(`/auth/onboarding?uid=${authData.user.id}&email=${encodeURIComponent(cleanEmail)}`);
    };

    const [resendLoading, setResendLoading] = useState(false);
    const [resendCount, setResendCount] = useState(0);

    const handleResendEmail = async () => {
        if (resendCount >= 3) {
            setError("Maximum resend attempts reached. Please try again later.");
            return;
        }

        setResendLoading(true);
        const supabase = createClient();
        const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: email.trim().toLowerCase(),
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            }
        });

        setResendLoading(false);
        if (resendError) {
            setError(resendError.message);
        } else {
            setResendCount(prev => prev + 1);
            // Optional: show a small success message for resending
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f5f5] text-zinc-900 font-sans flex flex-col">
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
            <main className="flex-1 w-full flex flex-col items-center px-4 sm:px-6 max-w-md mx-auto pb-12">
                {/* Hero Heading */}
                <div className="mb-8 mt-4 text-center">
                    <h1 className="text-5xl sm:text-6xl pt-4 font-bold font-manyto">
                        Step
                        <br />
                        <span className="text-[#ffc107]">Into</span><span className="text-[#2c2c2c]">The</span><span className="text-[#ffc107]">Hive</span>
                    </h1>
                </div>

                {/* Down Arrow */}
                <div className="mb-10">
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
                <form onSubmit={handleSubmit} className="w-full max-w-md border-2 border-[#ffc107]/40 rounded-[2rem] p-6 sm:p-10 space-y-7">

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    {/* Student Verification Disclaimer */}
                    <div className="flex items-start gap-3 bg-amber-100/50 border border-[#ffc107]/30 rounded-2xl p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#ffc107] shrink-0 mt-0.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                        <p className="text-[12px] text-zinc-700 font-medium leading-snug">
                            Please use your <span className="font-bold text-black">real name</span> and campus information. This helps us verify you as a student and maintain a trusted community.
                        </p>
                    </div>

                    {/* First Name & Last Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2">First Name</label>
                            <input
                                type="text"
                                placeholder="Harry"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, handleSubmit)}
                                className="w-full bg-transparent border border-zinc-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#ffc107] transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Last Name</label>
                            <input
                                type="text"
                                placeholder="Kumi"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, handleSubmit)}
                                className="w-full bg-transparent border border-zinc-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#ffc107] transition-colors"
                            />
                        </div>
                    </div>

                    {/* Username & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2">Username</label>
                            <input
                                type="text"
                                placeholder="netskiper"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, handleSubmit)}
                                className="w-full bg-transparent border border-zinc-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#ffc107] transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Email</label>
                            <input
                                type="email"
                                placeholder="example@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, handleSubmit)}
                                className="w-full bg-transparent border border-zinc-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#ffc107] transition-colors"
                            />
                        </div>
                    </div>

                    {/* Passwords */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, handleSubmit)}
                                    className="w-full bg-transparent border border-zinc-300 rounded-lg px-4 py-2.5 pr-10 text-sm outline-none focus:border-[#ffc107] transition-colors"
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
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, handleSubmit)}
                                    className="w-full bg-transparent border border-zinc-300 rounded-lg px-4 py-2.5 pr-10 text-sm outline-none focus:border-[#ffc107] transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-amber-500 focus:outline-none"
                                >
                                    {showConfirmPassword ? (
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
                        </div>
                    </div>

                    {/* Terms & Conditions Checkbox */}
                    <div className="flex items-start gap-3 mt-4 pt-2">
                        <input
                            type="checkbox"
                            checked={agreeToTerms}
                            onChange={(e) => setAgreeToTerms(e.target.checked)}
                            className="w-3 h-3 mt-0.75 accent-[#ffc107] border-zinc-300 rounded focus:ring-[#ffc107]"
                        />
                        <label className="text-sm text-zinc-600 leading-tight">
                            I agree to the{" "}
                            <Link href="/terms" className="text-[#ffc107] font-semibold cursor-pointer hover:underline">
                                Terms of Service
                            </Link>
                            {" "}and{" "}
                            <Link href="/privacy" className="text-[#ffc107] font-semibold cursor-pointer hover:underline">
                                Privacy Policy
                            </Link>.
                        </label>
                    </div>
                </form>

                {/* Sign In Link */}
                <div className="w-full max-w-md mt-6 text-center text-lg">
                    <span className="text-zinc-900">Already have an account? </span>
                    <Link href="/auth/signin" className="text-[#ffc107] font-semibold hover:underline">
                        Sign In
                    </Link>
                </div>

                {/* Continue Button */}
                <div className="w-full max-w-md mt-10">
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
                        <span>{loading ? "Creating Account..." : "Continue"}</span>
                    </button>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default RegisterPage;
