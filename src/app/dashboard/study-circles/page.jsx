"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Search01Icon,
    ArrowLeft01Icon,
    SentIcon,
    Attachment01Icon,
    Image01Icon,
    Menu01Icon,
    Cancel01Icon,
    UserGroupIcon,
    PinIcon,
    Add01Icon,
    InformationCircleIcon
} from "@hugeicons/core-free-icons";

// Dummy Study Circles Data
const myCircles = [
    {
        id: "circle-1",
        name: "CS Level 300 Study Group",
        course: "Computer Science",
        lastMessage: "David: Has anyone finished the algorithm assignment?",
        timestamp: "10:42 AM",
        unread: 5,
        members: 124,
        avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        pinnedMsg: "Algorithm Assignment due this Friday at 11:59PM!"
    },
    {
        id: "circle-2",
        name: "Campus Entrepreneurs",
        course: "Business & Startups",
        lastMessage: "Sarah: The pitch deck check-in is tomorrow.",
        timestamp: "Yesterday",
        unread: 0,
        members: 89,
        avatar: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        pinnedMsg: "Next meetup: KNUST Business School Hall, 5PM."
    },
    {
        id: "circle-3",
        name: "Nursing Anatomy Help",
        course: "Nursing",
        lastMessage: "You: Thank you for the brain diagrams!",
        timestamp: "Monday",
        unread: 0,
        members: 42,
        avatar: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        pinnedMsg: "Anatomy Quiz 3 scope covers Chapters 4-6."
    }
];

const discoverCircles = [
    {
        id: "circle-4",
        name: "Calculus II Tutors",
        course: "Mathematics",
        members: 210,
        avatar: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        description: "A community for helping each other survive Calculus II."
    },
    {
        id: "circle-5",
        name: "UI/UX Design Enthusiasts",
        course: "Design",
        members: 156,
        avatar: "https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        description: "Share your Figma prototypes and get feedback!"
    }
];

// Dummy messages for an active circle
const initialMessages = [
    { id: 1, sender: "David", text: "Hey everyone! Let's start a thread for the upcoming project.", timestamp: "10:30 AM", avatar: "https://i.pravatar.cc/150?12" },
    { id: 2, sender: "Sarah", text: "Agreed. I am stuck on the second part of the algorithm.", timestamp: "10:32 AM", avatar: "https://i.pravatar.cc/150?15" },
    { id: 3, sender: "me", text: "I figured it out, I can share a snippet in a bit.", timestamp: "10:35 AM", avatar: "https://i.pravatar.cc/150?95" },
    { id: 4, sender: "David", text: "Has anyone finished the algorithm assignment?", timestamp: "10:42 AM", avatar: "https://i.pravatar.cc/150?12" }
];

export default function StudyCirclesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("my"); // "my" or "discover"

    // Determine active layout based on screen size implicitly by using CSS media queries on states
    const [activeCircleId, setActiveCircleId] = useState("circle-1"); // Default open for PC view
    const [isMobileListVisible, setIsMobileListVisible] = useState(true);

    const [newMessage, setNewMessage] = useState("");
    const [messages, setMessages] = useState(initialMessages);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom of active chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Handle Escape key to close active chat and handle browser back button
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" || e.keyCode === 27) {
                if (!isMobileListVisible) {
                    window.history.back(); // Triggers popstate
                } else {
                    setActiveCircleId(null);
                }
            }
        };

        const handlePopState = (e) => {
            if (!isMobileListVisible) {
                setIsMobileListVisible(true);
            }
        };

        window.addEventListener("keydown", handleKeyDown, true);
        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("keydown", handleKeyDown, true);
            window.removeEventListener("popstate", handlePopState);
        };
    }, [isMobileListVisible]);

    const openCircle = (id) => {
        setActiveCircleId(id);
        if (isMobileListVisible && window.innerWidth < 768) {
            setIsMobileListVisible(false); // Hide list on mobile
            // Push a virtual state to the browser history so the back button closes the circle
            window.history.pushState({ chatOpen: true }, "", window.location.href);
        } else {
            setIsMobileListVisible(false);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const newMsg = {
            id: messages.length + 1,
            sender: "me",
            text: newMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            avatar: "https://i.pravatar.cc/150?95"
        };

        setMessages([...messages, newMsg]);
        setNewMessage("");
        setTimeout(scrollToBottom, 100);
    };

    const activeCircleData = [...myCircles, ...discoverCircles].find(c => c.id === activeCircleId);
    const displayedList = activeTab === "my" ? myCircles : discoverCircles;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-32px)] md:min-h-[750px] bg-white md:bg-[#fcf6de] md:px-4 sm:px-8 md:gap-4 max-w-[1400px] mx-auto w-full md:pb-4">

            {/* Header */}
            <div className={`flex items-center justify-between mt-2 md:mt-4 px-4 md:px-0 shrink-0 ${!isMobileListVisible ? 'hidden md:flex' : ''}`}>
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5 text-gray-700" />
                    </Link>
                    <h1 className="text-3xl font-black tracking-wide font-newyork text-gray-900 hidden sm:block">
                        Study Circles
                    </h1>
                </div>
                <button className="bg-black text-white hover:bg-gray-800 font-bold text-[13px] px-5 py-2.5 rounded-full transition-colors active:scale-95 shadow-sm flex items-center gap-2">
                    <HugeiconsIcon icon={Add01Icon} className="w-4 h-4" />
                    Create Circle
                </button>
            </div>

            {/* Side-by-Side Container */}
            <div className="bg-white md:rounded-[2rem] md:shadow-sm md:border border-gray-100 flex flex-1 overflow-hidden relative mt-2 md:mt-0">

                {/* LEFT PANEL: Circle List */}
                <div className={`w-full md:w-[380px] lg:w-[420px] flex-col border-r border-gray-100 bg-white z-10 
                    ${isMobileListVisible ? 'flex' : 'hidden md:flex'} h-full`}>

                    {/* Header & Search */}
                    <div className="p-6 pb-2 border-b border-gray-100 shrink-0 flex flex-col gap-4">
                        <div className="flex items-center justify-between md:hidden">
                            <h2 className="text-2xl font-black font-newyork text-gray-900 mb-1">Study Circles</h2>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search circles or topics..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-full text-sm outline-none placeholder:text-gray-400 font-medium focus:border-[#ffc107] focus:bg-white transition-colors"
                            />
                            <HugeiconsIcon icon={Search01Icon} className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        </div>

                        {/* Tab Switcher */}
                        <div className="flex bg-gray-100 p-1 rounded-full w-full">
                            <button
                                onClick={() => setActiveTab('my')}
                                className={`flex-1 py-1.5 text-sm font-bold rounded-full transition-colors ${activeTab === 'my' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                My Circles
                            </button>
                            <button
                                onClick={() => setActiveTab('discover')}
                                className={`flex-1 py-1.5 text-sm font-bold rounded-full transition-colors ${activeTab === 'discover' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Discover
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {displayedList.map((circle) => (
                            <div
                                key={circle.id}
                                onClick={() => openCircle(circle.id)}
                                className={`flex items-center gap-4 p-4 lg:px-6 cursor-pointer transition-colors border-l-4 
                                    ${activeCircleId === circle.id
                                        ? 'bg-gray-50 border-[#ffc107]'
                                        : 'bg-white border-transparent hover:bg-gray-50/50 border-b border-b-gray-50'
                                    }`}
                            >
                                {/* Avatar */}
                                <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-gray-200">
                                    <img src={circle.avatar} alt={circle.name} className="w-full h-full object-cover" />
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <h3 className="font-bold text-gray-900 text-[15px] truncate pr-2">
                                            {circle.name}
                                        </h3>
                                        {activeTab === "my" && (
                                            <span className={`text-[11px] font-semibold shrink-0 ${activeCircleId === circle.id ? 'text-[#ffc107]' : 'text-gray-400'}`}>
                                                {circle.timestamp}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[9px] font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded-[4px]">{circle.course}</span>
                                        <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                                            <HugeiconsIcon icon={UserGroupIcon} className="w-3 h-3" />
                                            {circle.members}
                                        </div>
                                    </div>
                                    <p className={`text-[13px] truncate ${circle.unread > 0 ? 'text-black font-semibold' : 'text-gray-500 font-medium'}`}>
                                        {activeTab === "my" ? circle.lastMessage : circle.description}
                                    </p>
                                </div>

                                {/* Unread Indicator */}
                                {circle.unread > 0 && activeTab === "my" && (
                                    <div className="w-5 h-5 bg-[#ff3b30] text-white text-[10px] font-bold flex items-center justify-center rounded-full shrink-0">
                                        {circle.unread}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT PANEL: Active Circle Area */}
                <div className={`flex flex-col bg-[#fbf9f1] ${!isMobileListVisible ? 'fixed inset-0 z-[60] md:relative md:z-20 md:flex-1 md:h-full' : 'hidden md:flex md:flex-1 md:h-full'}`}>
                    {activeCircleData ? (
                        <>
                            {/* Circle Header */}
                            <div className="h-[76px] px-4 md:px-6 border-b border-gray-100 bg-white flex items-center justify-between shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)] z-10">
                                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                    {/* Mobile Back Button */}
                                    <button
                                        className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 -ml-2 shrink-0"
                                        onClick={() => window.history.back()}
                                    >
                                        <HugeiconsIcon icon={ArrowLeft01Icon} className="w-6 h-6 text-gray-900" />
                                    </button>

                                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-gray-200">
                                        <img src={activeCircleData.avatar} alt={activeCircleData.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-black text-gray-900 text-[16px] truncate">{activeCircleData.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-semibold text-gray-500">{activeCircleData.members} members</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500">
                                        <HugeiconsIcon icon={InformationCircleIcon} className="w-5 h-5" />
                                    </button>
                                    <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500">
                                        <HugeiconsIcon icon={Menu01Icon} className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!isMobileListVisible && window.innerWidth < 768) {
                                                window.history.back();
                                            } else {
                                                setActiveCircleId(null);
                                                setIsMobileListVisible(true);
                                            }
                                        }}
                                        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors text-gray-400 group hidden sm:flex"
                                    >
                                        <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>
                            </div>

                            {/* Pinned Message Banner */}
                            {(activeCircleData.pinnedMsg && activeTab === "my") && (
                                <div className="border-b border-gray-100 bg-blue-50/80 px-4 md:px-6 py-2.5 flex items-start gap-3 shrink-0 shadow-sm z-0">
                                    <HugeiconsIcon icon={PinIcon} className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Pinned Resource</span>
                                        <span className="font-bold text-gray-800 text-[13px] leading-tight max-w-[280px] lg:max-w-xl">
                                            {activeCircleData.pinnedMsg}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Messages Scroll Area */}
                            {activeTab === "my" ? (
                                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-20">
                                    {messages.map((msg, index) => {
                                        const isMe = msg.sender === "me";
                                        const showAvatar = !isMe && (index === 0 || messages[index - 1].sender !== msg.sender);

                                        return (
                                            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`flex max-w-[85%] md:max-w-[70%] gap-3`}>
                                                    {/* Other User Avatar */}
                                                    {!isMe ? (
                                                        <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden mt-1">
                                                            {showAvatar ? (
                                                                <img src={msg.avatar} alt={msg.sender} className="w-full h-full object-cover" />
                                                            ) : <div className="w-8 h-8"></div>}
                                                        </div>
                                                    ) : null}

                                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                        {showAvatar && !isMe && (
                                                            <span className="text-[11px] font-bold text-gray-500 ml-1 mb-1">{msg.sender}</span>
                                                        )}
                                                        <div className={`px-4 py-3 rounded-2xl shadow-sm ${isMe
                                                            ? 'bg-[#ffc107] text-black rounded-tr-sm'
                                                            : 'bg-white border border-gray-100 text-gray-900 rounded-tl-sm'
                                                            }`}>
                                                            <p className="text-[14px] font-medium leading-relaxed">
                                                                {msg.text}
                                                            </p>
                                                        </div>
                                                        <span className={`text-[10px] text-gray-400 font-medium mt-1 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                                                            {msg.timestamp}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} className="h-4 shrink-0" />
                                </div>
                            ) : (
                                /* Discover Mode - Join Group Banner */
                                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/50 text-center">
                                    <div className="w-32 h-32 rounded-[2rem] overflow-hidden shadow-lg border-4 border-white mb-6">
                                        <img src={activeCircleData.avatar} alt={activeCircleData.name} className="w-full h-full object-cover" />
                                    </div>
                                    <h2 className="text-3xl font-black font-newyork text-gray-900 mb-2">{activeCircleData.name}</h2>
                                    <p className="text-gray-500 font-medium mb-6 max-w-sm">{activeCircleData.description}</p>
                                    <div className="flex items-center gap-4 text-gray-600 font-bold bg-white px-6 py-2 rounded-full border border-gray-200 shadow-sm mb-8">
                                        <div className="flex items-center gap-1"><HugeiconsIcon icon={UserGroupIcon} className="w-4 h-4" /> {activeCircleData.members} Members</div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                        <div className="text-blue-600">{activeCircleData.course}</div>
                                    </div>
                                    <button className="bg-black text-white hover:bg-gray-800 font-black px-10 py-4 rounded-full text-[16px] shadow-lg active:scale-95 transition-all">
                                        Join Study Circle
                                    </button>
                                </div>
                            )}

                            {/* Message Input Box (Only show if in My Circles) */}
                            {activeTab === "my" && (
                                <div className="p-3 md:p-4 bg-white border-t border-gray-100 shrink-0 pb-4 md:pb-4 z-10">
                                    <form
                                        onSubmit={handleSendMessage}
                                        className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-[1.5rem] p-2 pl-4 focus-within:border-[#ffc107] focus-within:bg-white focus-within:shadow-sm transition-all"
                                    >
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Message the circle..."
                                            className="flex-1 bg-transparent border-none outline-none resize-none text-gray-800 placeholder:text-gray-400 font-medium text-[14px] max-h-32 min-h-[40px] py-2.5"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage(e);
                                                } else if (e.key === 'Escape') {
                                                    setActiveCircleId(null);
                                                }
                                            }}
                                        />

                                        <div className="flex items-center gap-1 pb-1">
                                            <button type="button" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                                                <HugeiconsIcon icon={Attachment01Icon} className="w-4 h-4" />
                                            </button>
                                            <button type="button" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                                                <HugeiconsIcon icon={Image01Icon} className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={!newMessage.trim()}
                                                className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ml-1"
                                            >
                                                <HugeiconsIcon icon={SentIcon} className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Empty State if no circle is selected */
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50">
                            <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                                {/* Decorative rings */}
                                <div className="absolute inset-0 border-[3px] border-[#ffc107]/20 rounded-full animate-[ping_3s_ease-in-out_infinite]"></div>
                                <div className="absolute inset-2 border-[2px] border-[#ffc107]/40 rounded-full animate-[ping_3s_ease-in-out_infinite_animation-delay-500ms]"></div>
                                {/* Central Icon */}
                                <div className="relative z-10 w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
                                    <HugeiconsIcon icon={UserGroupIcon} className="w-10 h-10 text-[#ffc107]" variant="solid" tone="solid" strokeWidth={2} />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black font-newyork text-gray-900 mb-3 tracking-wide">Study Circles</h3>
                            <p className="text-gray-500 font-medium text-[15px] max-w-sm leading-relaxed mb-8">
                                Connect with coursemates, join academic discussions, and share resources easily. Choose a circle to start.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
