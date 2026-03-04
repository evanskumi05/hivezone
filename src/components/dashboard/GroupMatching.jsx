"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { BookOpen01Icon } from "@hugeicons/core-free-icons";

const RightSidebarWidgets = () => {
    return (
        <div className="flex flex-col gap-2 pb-4 w-full">

            {/* 1. Group Matching Card */}
            <div className="bg-white rounded-[2.5rem] p-3 shadow-sm border border-[#fcf6de] flex flex-col items-center">
                <div className="flex items-center gap-1 w-full justify-center mb-4">
                    <div className="w-[72px] h-[72px] rounded-full border border-gray-100 overflow-hidden shrink-0">
                        <img
                            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&q=80"
                            alt="Group"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="flex flex-col">
                        <span className="text-xl font-medium text-gray-900 tracking-tight">Group Of Intelligent... 😎</span>
                        <span className="text-sm text-gray-400 mt-0.5">That's an incredible answer!..</span>
                    </div>
                </div>

                <button className="px-5 py-1.5 rounded-full border border-[#ffc107] text-[11px] font-medium text-gray-500 hover:bg-[#ffc107]/10 transition-colors">
                    view more groups
                </button>
            </div>

            {/* 2. Notes and Summaries Card */}
            <div className="bg-white rounded-[2.5rem] p-3 shadow-sm border border-[#fcf6de] flex flex-col items-center text-center gap-2">
                <h3 className="text-[26px] font-black font-newyork tracking-wide text-gray-900">
                    Notes and Summaries
                </h3>

                <div className="flex items-center gap-3 text-gray-800">
                    <HugeiconsIcon icon={BookOpen01Icon} className="w-6 h-6" strokeWidth={1.5} />
                    <span className="text-[17px] text-gray-800 tracking-tight">Brain Physiology Summary</span>
                </div>

                <button className="px-5 py-1.5 rounded-full border border-[#ffc107] text-[11px] font-medium text-gray-500 hover:bg-[#ffc107]/10 transition-colors mt-1">
                    view all notes
                </button>
            </div>

            {/* 3. Ask a Question Card */}
            <div className="bg-white rounded-[2.5rem] p-3 shadow-sm border border-[#fcf6de] flex flex-col items-center text-center gap-2">
                <h3 className="text-[26px] font-black font-newyork tracking-wide text-gray-900">
                    Ask a question?
                </h3>

                <div className="w-full bg-[#efefef] rounded-full p-2 pl-6 flex items-center justify-between">
                    <input
                        type="text"
                        placeholder="Write something....."
                        className="bg-transparent placeholder:text-gray-500 text-sm text-gray-800 outline-none flex-1 min-w-0"
                    />
                    <button className="bg-[#ffc107] hover:bg-[#ffca2c] text-black font-semibold text-[15px] px-8 py-2.5 rounded-full transition-colors shrink-0">
                        Post
                    </button>
                </div>
            </div>

        </div>
    );
};

export default RightSidebarWidgets;
