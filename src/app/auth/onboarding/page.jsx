"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Footer from "@/components/Footer";
import CustomDropdown from "@/components/CustomDropdown";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

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
    "BSc Engineering",
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!institution || !programme || !gender || !yearOfStudy || !dateOfBirth || !studentId || !contact || !displayName) {
            setError("Please fill in all the details.");
            return;
        }

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

        const { error: updateError } = await supabase
            .from('users')
            .update({
                institution,
                programme,
                student_id: studentId,
                year_of_study: yearOfStudy,
                gender,
                date_of_birth: dateOfBirth,
                contact,
                display_name: displayName,
                is_onboarded: true
            })
            .eq('id', userIdToUpdate);

        setLoading(false);
        if (updateError) {
            setError(updateError.message);
            return;
        }

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
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold font-manyto">Welcome Aboard!</h2>
                        <p className="text-zinc-600">
                            Your profile is ready. Now, just verify your email to step into the hive.
                        </p>
                        {emailFromUrl && (
                            <p className="text-sm font-semibold text-black bg-[#ffc107]/10 py-2 px-4 rounded-full inline-block">
                                {decodeURIComponent(emailFromUrl)}
                            </p>
                        )}
                    </div>
                    <div className="pt-4">
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
            <main className="flex-1 flex flex-col items-center px-6 pb-12">
                {/* Hero Heading */}
                <div className="mb-4 text-center">
                    <h1 className="text-4xl md:text-5xl pt-4 md:pt-14 font-bold font-manyto text-black">
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
                <form onSubmit={handleSubmit} className="w-full max-w-md border-2 border-[#ffc107]/40 rounded-[2rem] px-6 py-10 space-y-7 bg-white/50 backdrop-blur-sm">
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
