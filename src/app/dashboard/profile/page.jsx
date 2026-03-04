"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useUI } from "@/components/ui/UIProvider";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { ProfileSkeleton } from "@/components/ui/Skeleton";

// Components
import Avatar from "@/components/ui/Avatar";

export default function ProfilePage() {
    const { showToast } = useUI();
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editSkills, setEditSkills] = useState("");
    const [editPortfolio, setEditPortfolio] = useState("");
    const [saving, setSaving] = useState(false);

    // Upload states
    const [uploadingProfile, setUploadingProfile] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const profileInputRef = React.useRef(null);
    const coverInputRef = React.useRef(null);

    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/auth/signin");
                return;
            }

            // Fetch profile data from public.users table
            const { data: profileData } = await supabase
                .from("users")
                .select("*")
                .eq("id", session.user.id)
                .single();

            if (profileData) {
                setProfile(profileData);
            }

            setLoading(false);
        };

        fetchUser();
    }, [router, supabase]);

    const openEditModal = () => {
        setEditSkills(skillsList.join(", "));
        setEditPortfolio(profile?.portfolio_links || "");
        setIsEditModalOpen(true);
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        // split by comma, trim whitespace, remove empty
        const skillsArray = editSkills.split(",").map(s => s.trim()).filter(s => s);

        const skillsString = skillsArray.join(", ");
        const portfolioString = editPortfolio.trim();

        const { error } = await supabase
            .from("users")
            .update({ skills: skillsString, portfolio_links: portfolioString })
            .eq("id", profile.id);

        setSaving(false);

        if (!error) {
            setProfile({ ...profile, skills: skillsString, portfolio_links: portfolioString });
            setIsEditModalOpen(false);
            showToast("Profile updated successfully!");
        } else {
            console.error("Error updating profile:", error);
            showToast("Failed to update profile", "error");
        }
    };

    /**
     * Handle Image Upload to Supabase Storage
     * type = 'profile_picture' | 'cover_photo'
     */
    const handleImageUpload = async (event, type) => {
        try {
            const file = event.target.files[0];
            if (!file) return;

            // Validate file size (e.g., max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showToast("File size must be less than 5MB", "error");
                return;
            }

            if (type === 'profile_picture') setUploadingProfile(true);
            else setUploadingCover(true);

            // 1. If an old image exists, attempt to delete it first to save space
            if (profile[type]) {
                try {
                    const oldUrl = profile[type];
                    const urlParts = oldUrl.split('/avatars/');
                    if (urlParts.length === 2) {
                        // Decode just in case, and strip any query parameters
                        const oldFilePath = decodeURIComponent(urlParts[1].split('?')[0]);

                        // Remove the old file
                        const { error: removeError } = await supabase.storage.from('avatars').remove([oldFilePath]);
                        if (removeError) {
                            console.error("Supabase remove error:", removeError.message);
                        } else {
                            // Optional: ignore error if old file doesn't exist anymore
                        }
                    }
                } catch (deleteError) {
                    console.error("Failed to delete old image:", deleteError);
                    // Proceed with upload even if delete fails
                }
            }

            // 2. Upload new file to Supabase Storage (avatars bucket)
            const fileExt = file.name.split('.').pop();
            const fileName = `${profile.id}_${type}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${profile.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { cacheControl: '3600', upsert: true });

            if (uploadError) throw uploadError;

            // 3. Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 4. Update the user record in the database
            const { error: updateError } = await supabase
                .from('users')
                .update({ [type]: publicUrl })
                .eq('id', profile.id);

            if (updateError) throw updateError;

            // 4. Update local state
            setProfile({ ...profile, [type]: publicUrl });

        } catch (error) {
            console.error(`Error uploading ${type}:`, error);
            showToast(`Failed to upload ${type.replace('_', ' ')}.`, "error");
        } finally {
            if (type === 'profile_picture') setUploadingProfile(false);
            else setUploadingCover(false);
            // Reset the input value so the same file can be selected again if needed
            event.target.value = null;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fcf6de]">
                <ProfileSkeleton />
            </div>
        );
    }

    // Safely parse skills and portfolio in case they are stored as strings in legacy DB entries
    // Strip out any weird JSON brackets/quotes if we accidentally saved them as stringified arrays earlier
    const parseStringList = (str) => {
        if (!str || typeof str !== 'string' || str.trim() === '') return [];
        // Replace brackets and quotes, then split by either comma or newline
        const cleanStr = str.replace(/[\[\]"']/g, '').replace(/\n/g, ',');
        return cleanStr.split(',').map(s => s.trim()).filter(s => s);
    };

    const skillsList = Array.isArray(profile?.skills)
        ? profile.skills
        : parseStringList(profile?.skills);

    // Normalize portfolio link to ensure it starts with http:// or https://
    const getValidUrl = (url) => {
        if (!url || url.trim() === "") return "";
        const trimmedUrl = url.trim();
        if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
            return trimmedUrl;
        }
        return `https://${trimmedUrl}`;
    };

    const handleKeyDown = (e, callback) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            callback();
        }
    };

    const singlePortfolioLink = profile?.portfolio_links?.trim() || "";
    const portfolioUrl = getValidUrl(singlePortfolioLink);

    return (
        <div className="flex flex-col h-full bg-white md:bg-[#fcf6de] md:p-4 lg:p-8 md:pt-0 max-w-[950px] mx-auto w-full">

            {/* Main Content Layout */}
            <div className="flex-1 overflow-y-auto scrollbar-hide pb-20 md:pb-10 w-full">
                <div className="bg-white md:bg-[#f4f4f4] md:rounded-[2.5rem] w-full min-h-[85vh] flex flex-col overflow-hidden relative md:border md:border-gray-200 md:shadow-sm">

                    {/* Cover Photo Area */}
                    <div className="h-32 sm:h-48 md:h-72 w-full relative group">
                        {uploadingCover ? (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-200/50 backdrop-blur-sm md:rounded-t-[2.5rem]">
                                <div className="w-8 h-8 border-4 border-[#ffc107] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : null}
                        {profile?.cover_photo ? (
                            <img
                                src={profile.cover_photo}
                                alt="Cover Photo"
                                className="w-full h-full object-cover object-center grayscale opacity-90 md:rounded-t-[2.5rem]"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-200 md:rounded-t-[2.5rem]"></div>
                        )}
                        {/* Camera Overlay for Cover */}
                        <button
                            onClick={() => coverInputRef.current?.click()}
                            className="absolute bottom-4 right-4 z-20 bg-black/50 hover:bg-black/70 p-2 sm:p-3 rounded-full text-white backdrop-blur-md transition-colors shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 8.46 5h7.08a2.31 2.31 0 0 1 1.632 1.175l.67 1.34h2.408A2.5 2.5 0 0 1 22.75 10v9.5a2.5 2.5 0 0 1-2.5 2.5H3.75a2.5 2.5 0 0 1-2.5-2.5V10c0-1.38 1.12-2.5 2.5-2.5h2.408l.67-1.34Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" />
                            </svg>
                        </button>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={coverInputRef}
                            onChange={(e) => handleImageUpload(e, 'cover_photo')}
                        />
                    </div>

                    {/* Profile Section */}
                    <div className="relative px-4 sm:px-8 md:px-12 pb-12 flex-1">

                        {/* Avatar overlapping cover */}
                        <div className="absolute -top-10 sm:-top-16 left-4 sm:left-8 md:left-12 z-30">
                            <div className="w-[84px] h-[84px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] rounded-full border-[4px] md:border-[6px] border-white md:border-[#f4f4f4] overflow-hidden bg-gray-200 shadow-sm relative group cursor-pointer"
                                onClick={() => profileInputRef.current?.click()}
                            >
                                {uploadingProfile ? (
                                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-800/40 backdrop-blur-[2px]">
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 border-[3px] sm:border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 z-20 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6 sm:w-8 sm:h-8">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 8.46 5h7.08a2.31 2.31 0 0 1 1.632 1.175l.67 1.34h2.408A2.5 2.5 0 0 1 22.75 10v9.5a2.5 2.5 0 0 1-2.5 2.5H3.75a2.5 2.5 0 0 1-2.5-2.5V10c0-1.38 1.12-2.5 2.5-2.5h2.408l.67-1.34Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" />
                                        </svg>
                                    </div>
                                )}
                                <Avatar
                                    src={profile?.profile_picture}
                                    name="Profile Avatar"
                                    className="w-full h-full"
                                />
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={profileInputRef}
                                onChange={(e) => handleImageUpload(e, 'profile_picture')}
                            />
                        </div>

                        {/* Top row: Edit Profile Button aligned to the right */}
                        <div className="w-full flex justify-end pt-3 md:pt-6">
                            <button onClick={openEditModal} className="px-4 py-1.5 md:px-6 md:py-2 rounded-full border border-gray-300 md:border-[#ffc107] text-gray-900 md:text-[#ffc107] font-bold text-[13px] md:text-[15px] hover:bg-gray-50 md:hover:bg-[#ffc107]/10 transition-colors">
                                Edit profile
                            </button>
                        </div>

                        {/* Main Grid: Info + Banner on Left, Skills+Links on Right */}
                        <div className="mt-2 md:mt-2 grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8 md:gap-16 lg:gap-32 w-full max-w-5xl relative z-10">

                            {/* Left Column (Info + Banner) */}
                            <div className="flex flex-col mt-2 md:mt-0">
                                {/* Info Block */}
                                <h1 className="text-[26px] md:text-3xl sm:text-[34px] font-black font-newyork text-gray-900 tracking-tight leading-none">
                                    {profile?.display_name || (profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : "")}
                                </h1>
                                <span className="text-[14px] font-medium mt-1 text-gray-500">
                                    {profile?.username ? `@${profile.username}` : ""}
                                </span>

                                <div className="flex flex-col text-[13px] text-gray-600 font-medium mt-3 gap-0.5">
                                    <span>{profile?.institution || ""}</span>
                                    <span>{profile?.programme || ""}</span>
                                </div>

                                <p className="text-[13px] text-gray-600 font-medium mt-4 leading-relaxed pr-8">
                                    {profile?.bio || ""}
                                </p>


                            </div>

                            {/* Right Column (Skills, Portfolio, Groups) */}
                            <div className="flex flex-col gap-8 pt-2 md:pt-1">
                                {skillsList.length > 0 && (
                                    <div>
                                        <h3 className="text-[19px] font-black font-newyork text-gray-900 mb-3 tracking-wide">Skills</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <div className="px-4 py-1.5 rounded-full border border-[#ffc107] text-[13px] font-semibold flex items-center bg-[#fdfdfd] shadow-sm">
                                                {skillsList.map((skill, index) => (
                                                    <React.Fragment key={index}>
                                                        <span className="text-gray-500">{skill}</span>
                                                        {index < skillsList.length - 1 && <div className="w-px h-3.5 bg-gray-300 mx-2.5"></div>}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {singlePortfolioLink && (
                                    <div>
                                        <h3 className="text-[19px] font-black font-newyork text-gray-900 mb-3 tracking-wide">Portfolio Link</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <a
                                                href={portfolioUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-1.5 rounded-full border border-[#ffc107] text-[#ffb300] hover:text-[#e09e00] text-[13px] font-bold bg-[#fdfdfd] shadow-sm hover:bg-[#fcfcfc] transition-colors"
                                            >
                                                {singlePortfolioLink}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                </div>
            </div>
            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative border border-gray-100 transform transition-all">
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
                        >
                            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
                        </button>

                        <h2 className="text-2xl font-black font-newyork text-gray-900 mb-6 tracking-tight">Edit Profile Links</h2>

                        <div className="flex flex-col gap-5">
                            <div>
                                <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">Skills</label>
                                <input
                                    type="text"
                                    value={editSkills}
                                    onChange={(e) => setEditSkills(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, handleSaveProfile)}
                                    placeholder="e.g. Java, UI/UX, Python (comma separated)"
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-[#ffc107] focus:ring-1 focus:ring-[#ffc107] transition-all"
                                />
                                <span className="text-xs text-gray-400 ml-1 mt-1 block">Separate multiple skills with commas</span>
                            </div>

                            <div>
                                <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">Portfolio Link</label>
                                <input
                                    type="text"
                                    value={editPortfolio}
                                    onChange={(e) => setEditPortfolio(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, handleSaveProfile)}
                                    placeholder="e.g. netskiper.com"
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-[#ffc107] focus:ring-1 focus:ring-[#ffc107] transition-all"
                                />
                                <span className="text-xs text-gray-400 ml-1 mt-1 block">Add your primary portfolio or personal website link</span>
                            </div>

                            <button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="mt-4 w-full bg-[#ffc107] hover:bg-[#ffb300] text-gray-900 font-bold py-3.5 rounded-xl transition-all shadow-sm shadow-[#ffc107]/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {saving ? "Saving changes..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
