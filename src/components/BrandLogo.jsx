import React from 'react';
import Image from 'next/image';
import Typewriter from "@/components/Typewriter";

const BrandLogo = ({ className = "" }) => {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Image
                src="/hiveZoneLOGO.png"
                alt="HiveZone Logo"
                width={80}
                height={80}
                className="object-contain mt-[-28px]"
                priority
            />
            <div className="flex flex-col justify-center">
                <div className="flex items-baseline text-4xl sm:text-6xl font-medium tracking-normal">
                    <span className="font-manyto text-black">Hive</span>
                    <span className="font-newyork text-yellow-500">Zone</span>
                </div>
                <div className="mt-[-4px] pl-13">
                    <Typewriter />
                </div>
            </div>
        </div>
    );
};

export default BrandLogo;