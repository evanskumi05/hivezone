"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useUI } from "@/components/ui/UIProvider";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertIcon, ArrowLeft01Icon, Camera01Icon, Notification01Icon } from "@hugeicons/core-free-icons";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useRef } from "react";
import { getNotificationPermissionStatus, requestNotificationPermission, loginOneSignal } from "@/utils/OneSignalNative";

// Menu items based on the user's design image
const menuItems = [
    { id: "profile", label: "Edit Profile" },
    { id: "password", label: "Change Password" },
    { id: "notifications", label: "Notifications" },
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
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const [bioVisibility, setBioVisibility] = useState("everybody"); // everybody, contacts, nobody
    const [notificationPermission, setNotificationPermission] = useState("default"); // granted, denied, default
    const [checkingNotifications, setCheckingNotifications] = useState(false);

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
                .select("id, display_name, username, bio, profile_picture")
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
            
            // Sync with OneSignal for better tracking
            if (session.user.id) {
                loginOneSignal(session.user.id);
            }
        };

        fetchUser();
    }, [router, supabase]);

    // Check notification status when switching to the tab
    useEffect(() => {
        if (activeTab === "notifications") {
            const checkPermission = async () => {
                setCheckingNotifications(true);
                try {
                    const status = await getNotificationPermissionStatus();
                    setNotificationPermission(status || "default");
                } catch (e) {
                    console.error("Error checking notification status:", e);
                } finally {
                    setCheckingNotifications(false);
                }
            };
            checkPermission();
        }
    }, [activeTab]);

    const handleEnableNotifications = async () => {
        setCheckingNotifications(true);
        try {
            const result = await requestNotificationPermission();
            // result might be boolean (native) or string (web)
            const status = await getNotificationPermissionStatus();
            setNotificationPermission(status);
            
            if (status === 'granted') {
                showToast("Notifications enabled!");
            }
        } catch (error) {
            console.error("Error enabling notifications:", error);
            showToast("Failed to enable notifications.", "error");
        } finally {
            setCheckingNotifications(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !userId) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            showToast("Please upload an image file.", "error");
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            showToast("File size must be less than 2MB.", "error");
            return;
        }

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `avatars/${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;

            // 1. Get presigned URL from our API
            const response = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileName: fileName,
                    fileType: file.type,
                }),
            });

            if (!response.ok) throw new Error("Failed to get upload URL");
            const { uploadUrl, publicUrl } = await response.json();

            // 2. Upload directly to Cloudflare R2
            const uploadResponse = await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!uploadResponse.ok) throw new Error("Failed to upload");

            // 3. Update user profile in Supabase DB with the R2 public URL
            const { error: updateError } = await supabase
                .from('users')
                .update({ profile_picture: publicUrl })
                .eq('id', userId);

            if (updateError) throw updateError;

            setProfileData(prev => ({ ...prev, profilePicture: publicUrl }));
            showToast("Profile picture updated!");
        } catch (error) {
            console.error("Error uploading image:", error);
            showToast("Failed to upload image.", "error");
        } finally {
            setUploading(false);
        }
    };

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
            showToast("Failed to update profile", "error");
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
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-white shadow-sm mb-6 overflow-hidden flex items-center justify-center shrink-0">
                                    {uploading ? (
                                        <div className="animate-pulse bg-gray-200 w-full h-full" />
                                    ) : profileData.profilePicture ? (
                                        <img src={profileData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-[#ffc107]/10 flex items-center justify-center text-[#ffc107] font-bold text-xl">
                                            {profileData.displayName?.charAt(0) || "U"}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="absolute bottom-6 right-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition-transform active:scale-95 disabled:opacity-50"
                                >
                                    <HugeiconsIcon icon={Camera01Icon} className="w-4 h-4" />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    accept="image/*"
                                />
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
                                Add a few lines about yourself to help people get to know you better.
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

                    {/* Views for notifications and privacy are removed for now */}

                    {/* View: Notifications */}
                    {activeTab === "notifications" && (
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center">
                            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4">
                                <HugeiconsIcon icon={Notification01Icon} className="w-8 h-8 text-[#ffc107]" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2 font-newyork">Campus Notifications</h3>
                            <p className="text-gray-500 font-medium text-sm max-w-xs mb-8">
                                Stay updated on local campus gigs, study circle messages, and important alerts in your zone.
                            </p>

                            <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                                {/* Toggle Control */}
                                <div className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-5 flex items-center justify-between shadow-sm group hover:border-[#ffc107]/30 transition-all duration-300">
                                    <div className="flex flex-col items-start gap-0.5">
                                        <span className="text-[15px] font-black text-gray-900 tracking-tight">Push Notifications</span>
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                            {notificationPermission === 'granted' ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                    
                                    <button
                                        onClick={handleEnableNotifications}
                                        disabled={checkingNotifications || notificationPermission === 'denied'}
                                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-500 outline-none
                                            ${notificationPermission === 'granted' ? 'bg-[#ffc107] shadow-lg shadow-yellow-100' : 'bg-gray-200'}
                                            ${checkingNotifications ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:scale-105 active:scale-95'}
                                            ${notificationPermission === 'denied' ? 'opacity-30 grayscale cursor-not-allowed' : ''}
                                        `}
                                    >
                                        <span className="sr-only">Toggle Push Notifications</span>
                                        <span
                                            className={`${
                                                notificationPermission === 'granted' ? 'translate-x-7 bg-white shadow-sm' : 'translate-x-1.5 bg-gray-400'
                                            } inline-block h-5 w-5 transform rounded-full transition-all duration-500 ease-in-out`}
                                        />
                                    </button>
                                </div>

                                {/* Status Messages */}
                                {notificationPermission === 'denied' && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-left">
                                        <HugeiconsIcon icon={AlertIcon} size={18} className="text-red-500 shrink-0 mt-0.5" />
                                        <div className="flex flex-col gap-1">
                                            <p className="text-[13px] font-black text-red-900 leading-tight">Access Denied</p>
                                            <p className="text-[12px] font-medium text-red-600 leading-relaxed">
                                                To enable notifications, please go to your device's <b>Settings &gt; Apps &gt; HiveZone</b> and allow permissions manually.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                
                                {notificationPermission === 'granted' && (
                                    <div className="flex items-center gap-2 text-[#ffc107] font-bold text-[12px] tracking-wide">
                                        <span className="w-1.5 h-1.5 bg-[#ffc107] rounded-full animate-pulse shadow-glow shadow-yellow-400" />
                                        ACTIVE ON THIS DEVICE
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* View: Delete Account (Beta Message) */}
                    {activeTab === "delete" && (
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                                <HugeiconsIcon icon={AlertIcon} className="w-8 h-8 text-red-500 rotate-180" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2 font-newyork">Delete Account</h3>
                            <p className="text-gray-500 font-medium text-sm max-w-xs">
                                This feature is not available in beta right now. Please contact support if you need to deactivate your account.
                            </p>
                        </div>
                    )}

                    {/* View: Settings Placeholder */}
                    {(activeTab !== "profile" && activeTab !== "password" && activeTab !== "delete") && (
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm flex flex-col w-full min-h-[200px] items-center justify-center">
                            <p className="text-gray-500 font-medium text-sm">Select an option from the menu.</p>
                        </div>
                    )}

                </div>
            </div>

        </div>
    );
}
