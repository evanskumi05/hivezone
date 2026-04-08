"use client";

import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    BubbleChatIcon,
    Search01Icon,
    Delete01Icon
} from "@hugeicons/core-free-icons";
import { ConversationSkeleton } from "@/components/ui/Skeleton";
import { useChatConfig } from "@/components/providers/ChatProvider";
import { useUI } from "@/components/ui/UIProvider";
import Avatar from "@/components/ui/Avatar";
import UserBadge from "@/components/ui/UserBadge";

export default function ChatSidebar({ activeId }) {
    const { conversations, loadingConversations, hideConversation } = useChatConfig();
    const { confirmAction } = useUI();
    const [search, setSearch] = React.useState("");

    const filtered = search.trim()
        ? conversations.filter(c =>
            c.otherUser.computedName?.toLowerCase().includes(search.toLowerCase()) ||
            c.last_message?.toLowerCase().includes(search.toLowerCase())
          )
        : conversations;

    return (
        <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col border-r border-gray-100 h-full bg-white shrink-0">
            {/* Sidebar Header */}
            <div className="p-6 pb-2">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-black font-newyork text-gray-900 tracking-tight">Messages</h1>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                    <HugeiconsIcon icon={Search01Icon} size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search messages"
                        className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#ffc107]/20 transition-all"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto px-2 pb-4 md:pb-4 pb-20">
                {loadingConversations ? (
                    <div className="flex flex-col">
                        {[...Array(5)].map((_, i) => <ConversationSkeleton key={i} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-4">
                        <p className="text-[13px] text-gray-500 font-medium">{search ? 'No results found' : 'No messages yet'}</p>
                    </div>
                ) : (
                    filtered.map(chat => (
                        <Link
                            key={chat.id}
                            href={`/dashboard/chat/${chat.id}`}
                            className={`flex items-center gap-4 p-4 rounded-[2rem] transition-all group active:scale-[0.98] ${activeId === chat.id ? 'bg-[#ffc107]/10' : 'hover:bg-gray-50'
                                }`}
                        >
                            <div className="shrink-0">
                                <Avatar
                                    src={chat.otherUser.profile_picture}
                                    name={chat.otherUser.computedName || '?'}
                                    className="size-14 rounded-full border-2 border-white shadow-sm"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <h3 className={`text-[15px] truncate font-extrabold ${chat.unreadCount > 0 ? 'text-black' : (activeId === chat.id ? 'text-gray-900' : 'text-gray-800')}`}>
                                            {chat.otherUser.computedName}
                                        </h3>
                                        <UserBadge 
                                            isAdmin={chat.otherUser.is_admin} 
                                            isVerified={chat.otherUser.is_verified} 
                                            size="sm"
                                        />
                                    </div>
                                    <span className={`text-[11px] font-bold shrink-0 ${chat.unreadCount > 0 ? 'text-[#ffc107]' : 'text-gray-400'}`}>
                                        {new Date(chat.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                {chat.gig?.title && (
                                    <p className="text-[11px] font-black text-[#ffc107] uppercase tracking-widest truncate mb-0.5 opacity-90">
                                        {chat.gig.title}
                                    </p>
                                )}
                                <div className="flex justify-between items-center gap-2 mt-0.5">
                                    <p className={`text-[13px] truncate flex-1 ${chat.unreadCount > 0 ? 'font-bold text-black' : (activeId === chat.id ? 'font-medium text-gray-700' : 'font-medium text-gray-500')}`}>
                                        {chat.last_message}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                confirmAction({
                                                    title: "Hide Conversation",
                                                    message: "Are you sure you want to hide this conversation? It will reappear if they send a new message.",
                                                    confirmText: "Yes, hide it",
                                                    cancelText: "Cancel",
                                                    onConfirm: async () => {
                                                        await hideConversation(chat.id);
                                                    }
                                                });
                                            }}
                                            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-100 md:opacity-0 group-hover:opacity-100 z-10 shrink-0"
                                            title="Hide conversation"
                                        >
                                            <HugeiconsIcon icon={Delete01Icon} size={16} />
                                        </button>

                                        {chat.unreadCount > 0 && (
                                            <span className="w-5 h-5 min-w-[20px] bg-[#ffc107] text-black text-[10px] font-black rounded-full flex items-center justify-center shrink-0">
                                                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
