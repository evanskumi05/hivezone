import React from "react";
import Link from "next/link";
import Image from "next/image";

const FeatureNavigation = ({ nextFeatureName, nextFeaturePath }) => {
    return (
        <section className="w-full py-16 flex justify-center items-center">
            <Link
                href={nextFeaturePath}
                className="group flex flex-col items-center justify-center gap-4 transition-transform duration-300 hover:scale-105"
            >
                <p className="font-manyto text-lg md:text-xl text-zinc-500 font-medium">
                    Next feature
                </p>
                <div className="flex items-center gap-4">
                    <h3 className="text-3xl md:text-5xl font-bold font-newyork text-black group-hover:text-[#ffc107] transition-colors duration-300">
                        {nextFeatureName}
                    </h3>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-black flex items-center justify-center group-hover:border-[#ffc107] transition-colors duration-300">
                        <Image
                            src="/icons/rightarrow.svg"
                            alt="Next arrow"
                            width={16}
                            height={16}
                            className="object-contain invert"
                        />
                    </div>
                </div>
            </Link>
        </section>
    );
};

export default FeatureNavigation;
