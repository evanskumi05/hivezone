"use client";

import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge01Icon } from "@hugeicons/core-free-icons";

const Sidebar = () => {
    return (
        <aside className="w-72 hidden lg:flex">
            <div className="flex flex-col w-full rounded-[2.5rem] overflow-hidden shadow-sm border border-[#fcf6de] bg-[#f4f4f4]">

                {/* ================= TOP NAVIGATION ================= */}
                <div className="p-6 flex flex-col gap-3 bg-[#f4f4f4]">

                    <Link href="/dashboard/gigs" className="flex items-center justify-center py-4 px-6 rounded-full border border-[#ffc107] bg-white hover:bg-[#ffc107]/10 transition">
                        <span className="font-medium text-gray-800">Campus Gigs</span>
                    </Link>

                    <Link href="/dashboard/scholarships" className="flex items-center justify-center py-4 px-6 rounded-full border border-[#ffc107] bg-white hover:bg-[#ffc107]/10 transition">
                        <span className="font-medium text-gray-800">Scholarships</span>
                    </Link>

                    <Link href="/dashboard/internships" className="flex items-center justify-center py-4 px-6 rounded-full border border-[#ffc107] bg-white hover:bg-[#ffc107]/10 transition">
                        <span className="font-medium text-gray-800">Internships</span>
                    </Link>

                    <Link href="/dashboard/study-circles" className="flex items-center justify-center py-4 px-6 rounded-full border border-[#ffc107] bg-white hover:bg-[#ffc107]/10 transition">
                        <span className="font-medium text-gray-800">Study Circles</span>
                    </Link>
                </div>



            </div>
        </aside>
    );
};

export default Sidebar;