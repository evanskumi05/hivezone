"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    BubbleChatIcon,
    Search01Icon,
    MoreHorizontalIcon,
    Settings02Icon
} from "@hugeicons/core-free-icons";
import ChatSidebar from "@/components/dashboard/ChatSidebar";

export default function ChatPage() {
    return (
        <div className="flex h-[calc(100vh-64px)] md:h-[calc(100vh-32px)] bg-white md:bg-[#fcf6de] md:p-4 lg:p-8 md:pt-0 max-w-[1200px] mx-auto w-full overflow-hidden">
            <div className="flex w-full h-full bg-white md:rounded-[2.5rem] md:border md:border-gray-200 md:shadow-sm overflow-hidden">

                {/* Sidebar: Conversations List */}
                <ChatSidebar />

                {/* Main Content Area: Placeholder */}
                <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50/30">
                    <div className="flex flex-col items-center text-center max-w-sm px-8">
                        <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center mb-6">
                            <HugeiconsIcon icon={BubbleChatIcon} size={40} className="text-[#ffc107]" />
                        </div>
                        <h2 className="text-xl font-black font-newyork text-gray-900 mb-2">Your Inbox</h2>
                        <p className="text-sm text-gray-500 font-medium">Select a conversation from the list to start messaging.</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
