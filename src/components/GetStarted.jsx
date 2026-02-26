"use client";

import Image from "next/image";

const GetStarted = () => {
    return (
        <section className="flex flex-col items-center justify-center w-full py-8 md:py-12 px-4 gap-12">
            {/* Image */}
            <div className="w-full max-w-4xl aspect-[7/5] md:aspect-video relative overflow-hidden">
                <Image
                    src="/collab.png"
                    alt="Collaboration"
                    fill
                    className="object-contain"
                />
            </div>

            {/* Get Started Button */}
            <a href="/auth/register" className="group bg-black text-white px-14 py-3 flex items-center gap-3 font-semibold rounded-none transition-all hover:bg-zinc-800 active:scale-95 font-sans">
                <Image
                    src="/icons/rightarrow.svg"
                    alt="Arrow"
                    width={20}
                    height={20}
                    className="transition-transform group-hover:translate-x-1"
                />
                <span className="text-lg">Get Started</span>
            </a>
        </section>
    );
};

export default GetStarted;
