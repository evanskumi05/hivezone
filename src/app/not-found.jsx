import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#fcf6de] flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-8">
                <Image src="/logo.svg" alt="HiveZone Logo" width={180} height={50} className="mx-auto" />
            </div>

            <h1 className="text-[120px] font-black font-newyork text-[#ffc107] leading-none mb-4 -mt-4 drop-shadow-sm">
                404
            </h1>

            <h2 className="text-3xl font-black font-newyork text-gray-900 mb-3">
                Lost in the Hive?
            </h2>

            <p className="text-gray-600 font-medium max-w-sm mx-auto mb-10 text-lg">
                The gig, profile, or page you are looking for has been moved or doesn't exist anymore.
            </p>

            <Link
                href="/dashboard"
                className="bg-black text-white hover:bg-gray-800 font-bold text-lg px-8 py-4 rounded-full transition-transform active:scale-95 shadow-sm inline-flex items-center gap-2"
            >
                Fly back to Dashboard
            </Link>
        </div>
    );
}
