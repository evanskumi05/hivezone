"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Footer from "@/components/Footer";
import CustomDropdown from "@/components/CustomDropdown";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { validateDisplayName, validateStudentId, validatePhone, validateDateOfBirth } from "@/utils/validation";

const INSTITUTIONS = [
    "Knutsford University",
];

const GENDERS = ["Male", "Female", "Other"];

const STUDY_YEARS = [
    "Level 100",
    "Level 200",
    "Level 300",
    "Level 400",
];

const PROGRAMS = [
    "Bsc Computer Science",
    "BA Business Administration",
    "BSc Information Technology",
    "BSc Communication and Media Studies",
    "Bsc Nursing"
];

const OnboardingForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const uidFromUrl = searchParams.get("uid");
    const emailFromUrl = searchParams.get("email");

    const [institution, setInstitution] = useState("");
    const [programme, setProgramme] = useState("");
    const [gender, setGender] = useState("");
    const [yearOfStudy, setYearOfStudy] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [displayDOB, setDisplayDOB] = useState("");
    const [studentId, setStudentId] = useState("");
    const [contact, setContact] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isFinished, setIsFinished] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [resendCount, setResendCount] = useState(0);

    useEffect(() => {
        const checkStatus = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            
            // 1. Not logged in?
            if (!session) {
                // If we also don't have a UID in the URL, they shouldn't be here.
                if (!uidFromUrl) {
                    router.push("/auth/signin");
                }
                return;
            }

            // 2. Logged in? Check if they are already done with onboarding.
            const { data: profile } = await supabase
                .from('users')
                .select('is_onboarded')
                .eq('id', session.user.id)
                .single();

            if (profile?.is_onboarded) {
                router.push("/dashboard");
            }
        };
        checkStatus();
    }, [router, uidFromUrl]);

    const handleKeyDown = (e, callback) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            callback(e);
        }
    };

    const handleDateChange = (e) => {
        const rawDate = e.target.value;
        setDateOfBirth(rawDate);

        if (rawDate) {
            const [year, month, day] = rawDate.split('-');
            const shortYear = year.slice(-2);
            setDisplayDOB(`${day}/${month}/${shortYear}`);
        } else {
            setDisplayDOB("");
        }
    };

    const handleResendEmail = async () => {
        if (resendCount >= 3) {
            setError("Maximum resend attempts reached. Please try again later.");
            return;
        }

        setResendLoading(true);
        setResendSuccess(false);
        const supabase = createClient();

        // Get the email: from URL params or from the current session
        let emailToResend = emailFromUrl ? decodeURIComponent(emailFromUrl) : null;

        if (!emailToResend) {
            const { data: { session } } = await supabase.auth.getSession();
            emailToResend = session?.user?.email;
        }

        if (!emailToResend) {
            setError("Could not determine your email. Please try signing in.");
            setResendLoading(false);
            return;
        }

        const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: emailToResend.trim().toLowerCase(),
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            }
        });

        setResendLoading(false);
        if (resendError) {
            setError(resendError.message);
        } else {
            setResendSuccess(true);
            setResendCount(prev => prev + 1);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!institution || !programme || !gender || !yearOfStudy || !dateOfBirth || !studentId || !contact || !displayName) {
            setError("Please fill in all the details.");
            return;
        }

        const displayNameError = validateDisplayName(displayName.trim());
        if (displayNameError) { setError(displayNameError); return; }

        const studentIdError = validateStudentId(studentId.trim());
        if (studentIdError) { setError(studentIdError); return; }

        const phoneError = validatePhone(contact.trim());
        if (phoneError) { setError(phoneError); return; }

        const dobError = validateDateOfBirth(dateOfBirth);
        if (dobError) { setError(dobError); return; }

        setLoading(true);
        const supabase = createClient();

        // 1. Get User ID - either from session (logged in) or URL (just signed up)
        let userIdToUpdate = uidFromUrl;

        if (!userIdToUpdate) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                userIdToUpdate = session.user.id;
            }
        }

        if (!userIdToUpdate) {
            setError("Session expired. Please sign in or register again.");
            setLoading(false);
            return;
        }

        // 2. call our secure API to update the profile
        // We use an API route because unverified users might not have 
        // a session yet, which causes RLS to block client-side updates.
        try {
            const response = await fetch('/api/auth/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userIdToUpdate,
                    onboardingData: {
                        institution,
                        programme,
                        student_id: studentId,
                        year_of_study: yearOfStudy,
                        gender,
                        date_of_birth: dateOfBirth,
                        contact,
                        display_name: displayName,
                    }
                })
            });

            const result = await response.json();
            
            if (!response.ok) {
                setError(result.error || "Failed to update profile.");
                setLoading(false);
                return;
            }
        } catch (err) {
            setError("Network error. Please try again.");
            setLoading(false);
            return;
        }

        setLoading(false);

        // If we came from registration (confirmed email is likely ON), show the check email UI
        if (uidFromUrl) {
            setIsFinished(true);
        } else {
            router.push("/dashboard");
        }
    };

    if (isFinished) {
        return (
            <div className="min-h-screen bg-[#f5f5f5] text-zinc-900 font-sans flex flex-col items-center justify-center px-6">
                <div className="w-full max-w-md bg-white border-2 border-[#ffc107]/40 rounded-[2.5rem] p-10 text-center space-y-7 shadow-sm">
                    <div className="w-20 h-20 bg-[#ffc107]/10 rounded-full flex items-center justify-center mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-[#ffc107]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-4xl font-bold font-manyto">Welcome</h2>
                        <h3 className="text-2xl font-bold text-[#ffc107] -mt-2">Aboard the Hive!</h3>
                        <p className="text-zinc-600 leading-relaxed pt-2">
                            Your profile is ready. To keep our campus community safe, we need you to <span className="font-bold text-black border-b-2 border-[#ffc107]">click the link</span> we just sent to:
                        </p>
                        {emailFromUrl && (
                            <div className="bg-zinc-100 py-3 px-4 rounded-2xl flex items-center justify-center gap-2 border border-zinc-200 shadow-inner">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#ffc107]">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>
                                <span className="font-semibold text-black truncate max-w-xs">
                                    {decodeURIComponent(emailFromUrl)}
                                </span>
                            </div>
                        )}
                        <p className="text-xs text-zinc-400 italic">
                            Once verified, you'll have full access to the campus hive!
                        </p>
                    </div>

                    {/* Resend Verification Email */}
                    {resendSuccess && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-sm font-medium">
                            ✓ Verification email resent! Check your inbox.
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="pt-2 space-y-3">
                        <button
                            type="button"
                            onClick={handleResendEmail}
                            disabled={resendLoading || resendCount >= 3}
                            className="w-full bg-zinc-100 text-zinc-700 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            {resendLoading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></span>
                                    <span>Sending...</span>
                                </>
                            ) : resendCount >= 3 ? (
                                <span>Max resends reached</span>
                            ) : (
                                <span>Didn't get it? Resend Email</span>
                            )}
                        </button>
                        <Link 
                            href="/auth/signin" 
                            className="w-full bg-[#ffc107] text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#ffca2c] transition-colors"
                        >
                            <span>Go to Sign In</span>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f5f5] text-zinc-900 font-sans flex flex-col">
            {/* Logo */}
            <div className="w-full flex justify-center pt-10 pb-6">
                <a href="/" className="flex items-center">
                    <Image
                        src="/logo.svg"
                        alt="HiveZone Logo"
                        width={140}
                        height={40}
                        className="h-10 w-auto"
                        priority
                    />
                </a>
            </div>

            {/* Main Content */}
            <main className="flex-1 w-full flex flex-col items-center px-4 sm:px-6 max-w-md mx-auto pb-12">
                {/* Hero Heading */}
                <div className="mb-4 text-center">
                    <h1 className="text-4xl sm:text-5xl pt-4 sm:pt-14 font-bold font-manyto text-black">
                        Complete
                        <br />
                        Your <span className="font-manyto text-[#ffc107]">Profile</span>
                    </h1>
                </div>

                {/* Down Arrow */}
                <div className="mb-10 mt-6">
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
                <form onSubmit={handleSubmit} className="w-full max-w-md border-2 border-[#ffc107]/40 rounded-[2rem] p-6 sm:p-10 space-y-7 bg-white/50 backdrop-blur-sm">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    {/* Display Name */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">Display Name</label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, handleSubmit)}
                            className="w-full bg-transparent border border-zinc-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#ffc107] transition-colors"
                        />
                    </div>

                    {/* Name of Institution */}
                    <CustomDropdown
                        label="Name Of Institution"
                        options={INSTITUTIONS}
                        value={institution}
                        onChange={setInstitution}
                        placeholder="Knutsford University College"
                    />

                    {/* Programme Of Study */}
                    <CustomDropdown
                        label="Programme Of Study"
                        options={PROGRAMS}
                        value={programme}
                        onChange={setProgramme}
                        placeholder="Bsc Computer Science"
                    />

                    {/* Student ID & Year of Study */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2">Student ID</label>
                            <input
                                type="text"
                                placeholder="26103849"
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, handleSubmit)}
                                className="w-full bg-transparent border border-zinc-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#ffc107] transition-colors"
                            />
                        </div>
                        <CustomDropdown
                            label="Year Of Study"
                            options={STUDY_YEARS}
                            value={yearOfStudy}
                            onChange={setYearOfStudy}
                            placeholder="Select Level"
                        />
                    </div>

                    {/* Date of Birth & Gender */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2">Date Of Birth</label>
                            <div className="relative w-full">
                                {/* The visible styled input box */}
                                <input
                                    type="text"
                                    placeholder="dd/mm/yy"
                                    value={displayDOB}
                                    readOnly
                                    className="w-full bg-transparent border border-zinc-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#ffc107] transition-colors pointer-events-none"
                                />
                                {/* The invisible native date picker floating on top */}
                                <input
                                    type="date"
                                    value={dateOfBirth}
                                    onChange={handleDateChange}
                                    onClick={(e) => {
                                        if (e.target.showPicker) {
                                            try { e.target.showPicker(); } catch (err) { }
                                        }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>
                        <CustomDropdown
                            label="Gender"
                            options={GENDERS}
                            value={gender}
                            onChange={setGender}
                            placeholder="Male"
                        />
                    </div>

                    {/* Contact */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">Contact</label>
                        <input
                            type="tel"
                            placeholder="0500000000"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, handleSubmit)}
                            className="w-full bg-transparent border border-zinc-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#ffc107] transition-colors"
                        />
                    </div>
                </form>

                {/* Disclaimer */}
                <div className="w-full max-w-md mt-6 flex justify-center items-center gap-3">
                    <Image
                        src="/icons/disclaimer.svg"
                        alt="Disclaimer"
                        width={24}
                        height={24}
                    />
                    <span className="text-zinc-400 text-sm">We do not sell your account information</span>
                </div>

                {/* Step In Button */}
                <div className="w-full max-w-md mt-6">
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
                        <span>{loading ? "Completing Profile..." : "Step Into The Hive"}</span>
                    </button>
                </div>
            </main>

            <Footer />
        </div>
    );
};

const OnboardingPage = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#ffc107] border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <OnboardingForm />
        </Suspense>
    );
};

export default OnboardingPage;
