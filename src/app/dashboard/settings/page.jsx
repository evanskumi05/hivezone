"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useUI } from "@/components/ui/UIProvider";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { PageSkeleton } from "@/components/ui/Skeleton";

// Menu items based on the user's design image
const menuItems = [
    { id: "profile", label: "Edit Profile" },
    { id: "password", label: "Change Password" },
    { id: "notifications", label: "Notification Preferences" },
    { id: "privacy", label: "Show Profile Publicly" },
    { id: "delete", label: "Delete Account", isDestructive: true }
];

export default function SettingsPage() {
    const { showToast } = useUI();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("profile");
    const supabase = createClient();

    // Loading & state
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState(null);

    // Form states
    const [profileData, setProfileData] = useState({ displayName: "", username: "", bio: "", profilePicture: "" });
    const [passwordData, setPasswordData] = useState({ current: "", new: "", confirm: "" });
    const [bioVisibility, setBioVisibility] = useState("everybody"); // everybody, contacts, nobody

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/auth/signin");
                return;
            }

            setUserId(session.user.id);

            // Fetch profile data from public.users table
            const { data: userProfile } = await supabase
                .from("users")
                .select("*")
                .eq("id", session.user.id)
                .single();

            if (userProfile) {
                setProfileData({
                    displayName: userProfile.display_name || "",
                    username: userProfile.username || "",
                    bio: userProfile.bio || "",
                    profilePicture: userProfile.profile_picture || ""
                });
            }

            setLoading(false);
        };

        fetchUser();
    }, [router, supabase]);

    const handleUpdateProfile = async () => {
        if (!userId) return;
        setSaving(true);

        const { error } = await supabase
            .from("users")
            .update({
                display_name: profileData.displayName,
                bio: profileData.bio
            })
            .eq("id", userId);

        setSaving(false);

        if (!error) {
            showToast("Profile updated successfully!");
        } else {
            console.error("Error updating profile:", error);
            showToast("Failed to update profile.", "error");
        }
    };

    const handleUpdatePassword = async () => {
        if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
            showToast("Please fill in all password fields.", "info");
            return;
        }

        if (passwordData.new !== passwordData.confirm) {
            showToast("New passwords do not match.", "error");
            return;
        }

        if (passwordData.new.length < 6) {
            showToast("New password must be at least 6 characters long.", "info");
            return;
        }

        setSaving(true);

        // 1. Verify current password by signing in
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: session.user.email,
                password: passwordData.current
            });

            if (signInError) {
                setSaving(false);
                showToast("Current password is incorrect.", "error");
                return;
            }
        }

        // 2. Update to new password
        const { error: updateError } = await supabase.auth.updateUser({
            password: passwordData.new
        });

        setSaving(false);

        if (!updateError) {
            showToast("Password updated successfully!");
            setPasswordData({ current: "", new: "", confirm: "" });
        } else {
            console.error("Error updating password:", updateError);
            showToast(updateError.message || "Failed to update password.", "error");
        }
    };

    const handleKeyDown = (e, callback) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            callback();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fcf6de]">
                <PageSkeleton />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#fcf6de] p-4 sm:p-8 pt-0 gap-6 max-w-[1200px] mx-auto w-full">

            {/* Header */}
            <div className="flex items-center gap-4 mt-4 mb-4">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5 text-gray-700" />
                </button>
                <h1 className="text-3xl font-black tracking-wide font-newyork text-gray-900">
                    Settings
                </h1>
            </div>

            {/* Layout Container */}
            <div className="flex flex-col md:flex-row items-start gap-8 mt-2 pb-20 md:pb-10">

                {/* Left Sidebar Menu */}
                <div className="w-full md:w-72 shrink-0 bg-white border border-gray-300 rounded-[2rem] overflow-hidden flex flex-col shadow-sm">
                    {menuItems.map((item, index) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full text-left px-6 py-4 font-bold text-sm transition-colors border-b border-gray-100 last:border-0
                                ${activeTab === item.id ? "bg-gray-50 text-black" : "bg-white text-gray-600 hover:bg-gray-50 hover:text-black"}
                                ${item.isDestructive ? "text-red-500 hover:text-red-600 hover:bg-red-50" : ""}
                            `}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Right Content Area */}
                <div className="flex-1 w-full max-w-2xl flex flex-col gap-6">

                    {/* View: Edit Profile */}
                    {activeTab === "profile" && (
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center">
                            {/* Avatar Display */}
                            <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-white shadow-sm mb-6 overflow-hidden flex items-center justify-center shrink-0">
                                {profileData.profilePicture ? (
                                    <img src={profileData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-[#ffc107]/10 flex items-center justify-center text-[#ffc107] font-bold text-xl">
                                        {profileData.displayName?.charAt(0) || "U"}
                                    </div>
                                )}
                            </div>

                            <div className="w-full flex gap-4 mb-4">
                                <div className="flex-1">
                                    <label className="block text-[13px] font-bold text-gray-900 mb-1">Display name</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-[14px] px-4 py-2 text-sm outline-none focus:border-[#4a90e2]"
                                        value={profileData.displayName}
                                        onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                                        onKeyDown={(e) => handleKeyDown(e, handleUpdateProfile)}
                                    />
                                </div>
                                <div className="flex-1 opacity-60">
                                    <label className="block text-[13px] font-bold text-gray-900 mb-1">Username</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-[14px] px-4 py-2 text-sm outline-none bg-gray-50 cursor-not-allowed"
                                        value={profileData.username}
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="w-full mb-2">
                                <label className="block text-[13px] font-bold text-gray-900 mb-1">Your bio</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-[14px] px-4 py-3 text-sm outline-none resize-none h-[60px] focus:border-[#4a90e2]"
                                    value={profileData.bio}
                                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                ></textarea>
                            </div>

                            <p className="w-full text-[11px] text-gray-500 font-medium mb-6">
                                Add some few lines about yourself. Choose who can see your bio in <span className="text-[#ffc107] cursor-pointer hover:underline" onClick={() => setActiveTab('privacy')}>Settings</span>.
                            </p>

                            <button
                                onClick={handleUpdateProfile}
                                disabled={saving}
                                className="font-extrabold text-[15px] text-gray-900 border border-gray-200 hover:border-gray-300 hover:text-black hover:bg-gray-50 px-8 py-2.5 rounded-full transition-colors active:scale-[0.98] disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    )}

                    {/* View: Change Password */}
                    {activeTab === "password" && (
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center">
                            <div className="w-full mb-4">
                                <label className="block text-[13px] font-bold text-gray-900 mb-1">Current password</label>
                                <input
                                    type="password"
                                    className="w-full border border-gray-300 rounded-[14px] px-4 py-2.5 text-sm outline-none focus:border-[#4a90e2]"
                                    value={passwordData.current}
                                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                                    onKeyDown={(e) => handleKeyDown(e, handleUpdatePassword)}
                                />
                            </div>
                            <div className="w-full mb-4">
                                <label className="block text-[13px] font-bold text-gray-900 mb-1">New password</label>
                                <input
                                    type="password"
                                    className="w-full border border-gray-300 rounded-[14px] px-4 py-2.5 text-sm outline-none focus:border-[#4a90e2]"
                                    value={passwordData.new}
                                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                    onKeyDown={(e) => handleKeyDown(e, handleUpdatePassword)}
                                />
                            </div>
                            <div className="w-full mb-6">
                                <label className="block text-[13px] font-bold text-gray-900 mb-1">Confirm new password</label>
                                <input
                                    type="password"
                                    className="w-full border border-gray-300 rounded-[14px] px-4 py-2.5 text-sm outline-none focus:border-[#4a90e2]"
                                    value={passwordData.confirm}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                    onKeyDown={(e) => handleKeyDown(e, handleUpdatePassword)}
                                />
                            </div>
                            <button
                                onClick={handleUpdatePassword}
                                disabled={saving}
                                className="font-extrabold text-[15px] text-gray-900 border border-gray-200 hover:border-gray-300 hover:text-black hover:bg-gray-50 px-8 py-2.5 rounded-full transition-colors active:scale-[0.98] disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Done"}
                            </button>
                        </div>
                    )}

                    {/* View: Privacy / Bio Visibility */}
                    {activeTab === "privacy" && (
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm flex flex-col w-full">
                            <h3 className="text-[15px] font-extrabold text-gray-900 mb-4 tracking-tight">Who can see my bio?</h3>

                            <div className="flex flex-col gap-4 mb-4">
                                <label className="flex items-center justify-between cursor-pointer group">
                                    <span className="text-[14px] font-medium text-gray-800 group-hover:text-black">Everybody</span>
                                    <input
                                        type="radio"
                                        name="bioVisibility"
                                        className="w-4 h-4 accent-[#ffc107] cursor-pointer"
                                        checked={bioVisibility === "everybody"}
                                        onChange={() => setBioVisibility("everybody")}
                                    />
                                </label>
                                <label className="flex items-center justify-between cursor-pointer group">
                                    <span className="text-[14px] font-medium text-gray-800 group-hover:text-black">My Contacts</span>
                                    <input
                                        type="radio"
                                        name="bioVisibility"
                                        className="w-4 h-4 accent-[#ffc107] cursor-pointer"
                                        checked={bioVisibility === "contacts"}
                                        onChange={() => setBioVisibility("contacts")}
                                    />
                                </label>
                                <label className="flex items-center justify-between cursor-pointer group">
                                    <span className="text-[14px] font-medium text-gray-800 group-hover:text-black">Nobody</span>
                                    <input
                                        type="radio"
                                        name="bioVisibility"
                                        className="w-4 h-4 accent-[#ffc107] cursor-pointer"
                                        checked={bioVisibility === "nobody"}
                                        onChange={() => setBioVisibility("nobody")}
                                    />
                                </label>
                            </div>

                            <p className="text-[11px] text-gray-500 font-medium mb-8">
                                You can add users or entire groups that will not see your bio.
                            </p>

                            <h3 className="text-[13px] font-extrabold text-gray-900 mb-3 tracking-tight">Add Exceptions</h3>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[14px] font-medium text-gray-800">Never Share With</span>
                                <button className="text-[14px] font-bold text-[#ffc107] hover:text-[#ffca2c] transition-colors">
                                    Add Users
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-500 font-medium">
                                You can restrict who can see the bio on your profile with granular precision.
                            </p>
                        </div>
                    )}

                    {/* View: Settings Placeholder */}
                    {(activeTab !== "profile" && activeTab !== "password" && activeTab !== "privacy") && (
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm flex flex-col w-full min-h-[200px] items-center justify-center">
                            <p className="text-gray-500 font-medium text-sm">Additional settings go here.</p>
                        </div>
                    )}

                </div>
            </div>

        </div>
    );
}
