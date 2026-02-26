"use client";

import GetStarted from './GetStarted';
import SectionSeparator from './SectionSeparator';
import Features from './Features';

const LandingPage = () => {
    return (
        <main className="flex-1 flex flex-col items-center">
            <div className="flex flex-col items-center justify-center pt-12 pb-6 md:pt-24 md:pb-12 px-4 w-full">
                <div className="inline-block text-left">
                    <h1 className="text-5xl sm:text-8xl font-bold mb-4 text-black leading-tight">
                        <span className="font-manyto text-[#2c2c2c] sm:text-[#ffc107]">Your</span><br className="sm:hidden" /><span className="font-manyto text-[#ffc107] sm:text-[#2c2c2c]">{' '}Campus.</span><br />
                        <span className="font-manyto text-[#2c2c2c]">Your</span><br className="sm:hidden" /><span className="font-manyto text-[#ffc107]">{' '}Hive.</span><br />
                        <span className="font-manyto text-[#2c2c2c] sm:text-[#ffc107]">Your</span><br className="sm:hidden" /><span className="font-manyto text-[#ffc107] sm:text-[#2c2c2c]">{' '}Zone.</span>
                    </h1>
                </div>
            </div>

            <SectionSeparator />
            <Features />
            <SectionSeparator />
            <GetStarted />
        </main>
    );
};

export default LandingPage;
