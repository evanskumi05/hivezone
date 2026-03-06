"use client";

import React, { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ArrowLeft01Icon,
    Tick01Icon,
    Image01Icon,
    Attachment01Icon,
    UserGroupIcon,
    LockIcon,
    Delete02Icon,
    LicenseIcon
} from "@hugeicons/core-free-icons";
import { createClient } from "@/utils/supabase/client";
import { useUI } from "@/components/ui/UIProvider";

export default function EditCirclePage({ params }) {
    const router = useRouter();
    const { showToast, confirmAction } = useUI();
    const supabase = createClient();
    const { id } = use(params);

    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState("");
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: "",
        course: "",
        description: "",
        is_private: false,
        avatar_url: ""
    });

    useEffect(() => {
        const loadCircle = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/login");
                return;
            }

            const { data: profileData } = await supabase
                .from("users")
                .select("*")
                .eq("id", session.user.id)
                .single();
            setProfile(profileData);

            const { data: circle, error } = await supabase
                .from("study_circles")
                .select("*")
                .eq("id", id)
                .single();

            if (error || !circle) {
                showToast("Circle not found", "error");
                router.push("/dashboard/study-circles");
                return;
            }

            // Security check
            if (circle.created_by !== session.user.id) {
                showToast("Only creators can edit circle settings", "error");
                router.push("/dashboard/study-circles");
                return;
            }

            setFormData({
                name: circle.name,
                course: circle.course || "",
                description: circle.description || "",
                is_private: circle.is_private,
                avatar_url: circle.avatar_url || ""
            });
            setIsLoading(false);
        };
        loadCircle();
    }, [id, router, supabase, showToast]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !profile) return;

        setIsSaving(true);
        let updatedAvatarUrl = formData.avatar_url;

        // Handle File Upload
        if (selectedAvatarFile) {
            const fileExt = selectedAvatarFile.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 9)}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('study-circles')
                .upload(filePath, selectedAvatarFile);

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from('study-circles')
                    .getPublicUrl(filePath);
                updatedAvatarUrl = publicUrl;
            } else {
                showToast("Image upload failed. Other changes will be saved.", "error");
            }
        }

        const { error } = await supabase
            .from("study_circles")
            .update({
                name: formData.name,
                course: formData.course,
                description: formData.description,
                is_private: formData.is_private,
                avatar_url: updatedAvatarUrl
            })
            .eq("id", id);

        if (!error) {
            showToast("Changes saved successfully!", "success");
            router.push("/dashboard/study-circles");
        } else {
            showToast("Failed to save changes", "error");
        }
        setIsSaving(false);
    };

    const handleDelete = () => {
        confirmAction({
            title: "Delete Study Circle",
            message: "This will permanently remove the circle and all its messages. This action cannot be undone.",
            confirmText: "Delete Forever",
            cancelText: "Keep Circle",
            type: "danger",
            onConfirm: async () => {
                const { error } = await supabase
                    .from("study_circles")
                    .delete()
                    .eq("id", id);

                if (!error) {
                    showToast("Study Circle deleted", "success");
                    router.push("/dashboard/study-circles");
                } else {
                    showToast("Failed to delete circle", "error");
                }
            }
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white md:bg-[#fcf6de] flex items-center justify-center p-8">
                <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white md:bg-[#fcf6de] md:p-8 pb-32 md:pb-8">
            <div className="max-w-2xl mx-auto">
                {/* Back Link */}
                <Link
                    href="/dashboard/study-circles"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold mb-8 group transition-colors"
                >
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center group-hover:bg-gray-50 transition-colors shadow-sm">
                        <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5" />
                    </div>
                    Back to Circles
                </Link>

                <div className="bg-white md:rounded-[3rem] md:shadow-xl md:border border-gray-100 overflow-hidden">
                    <div className="p-8 md:p-12">
                        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
                            <div>
                                <h1 className="text-4xl font-black font-newyork text-gray-900 mb-2">Circle Settings</h1>
                                <p className="text-gray-500 font-medium tracking-tight">Manage your circle's identity and privacy.</p>
                            </div>
                            <button
                                onClick={handleDelete}
                                className="px-6 py-2.5 bg-red-50 text-red-600 rounded-full text-xs font-black hover:bg-red-100 transition-colors flex items-center gap-2"
                            >
                                <HugeiconsIcon icon={Delete02Icon} className="w-4 h-4" />
                                Delete Circle
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-8">
                            {/* Avatar Section */}
                            <div className="flex flex-col md:flex-row items-center gap-8 bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100">
                                <div className="w-32 h-32 rounded-[2.5rem] border-4 border-white bg-white shrink-0 shadow-lg overflow-hidden flex items-center justify-center relative group cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {(avatarPreview || formData.avatar_url) ? (
                                        <img src={avatarPreview || formData.avatar_url} className="w-full h-full object-cover" alt="Preview" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-1">
                                            <HugeiconsIcon icon={Image01Icon} className="w-8 h-8 text-gray-300" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[11px] font-black tracking-widest uppercase">
                                        Update
                                    </div>
                                </div>
                                <div className="flex-1 space-y-3 text-center md:text-left">
                                    <h3 className="text-lg font-black text-gray-900">Circle Profile Picture</h3>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                        Change how your circle looks in the directory. Best at 1:1 ratio.
                                    </p>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setSelectedAvatarFile(file);
                                                setAvatarPreview(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="inline-flex items-center gap-2 bg-white px-6 py-2.5 rounded-full border border-gray-200 text-xs font-black shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
                                    >
                                        <HugeiconsIcon icon={Attachment01Icon} className="w-4 h-4 text-[#ffc107]" />
                                        {selectedAvatarFile ? selectedAvatarFile.name : "Upload New Image"}
                                    </button>
                                </div>
                            </div>

                            {/* Core Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Circle Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full h-14 px-6 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:bg-white focus:border-[#ffc107] outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject / Course</label>
                                    <input
                                        type="text"
                                        value={formData.course}
                                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                        className="w-full h-14 px-6 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:bg-white focus:border-[#ffc107] outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Privacy Level</label>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, is_private: false })}
                                        className={`flex-1 flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${!formData.is_private ? 'border-blue-500 bg-blue-50 shadow-inner' : 'border-gray-50 bg-gray-50 hover:border-gray-100'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!formData.is_private ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                            <HugeiconsIcon icon={UserGroupIcon} className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className={`text-[13px] font-black ${!formData.is_private ? 'text-blue-700' : 'text-gray-500'}`}>Public</span>
                                            <span className="text-[10px] text-gray-400 font-bold">Visible to everyone</span>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, is_private: true })}
                                        className={`flex-1 flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${formData.is_private ? 'border-[#ffc107] bg-[#fff9e6] shadow-inner' : 'border-gray-50 bg-gray-50 hover:border-gray-100'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.is_private ? 'bg-[#ffc107] text-black' : 'bg-gray-200 text-gray-400'}`}>
                                            <HugeiconsIcon icon={LockIcon} className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className={`text-[13px] font-black ${formData.is_private ? 'text-[#8a6800]' : 'text-gray-500'}`}>Private</span>
                                            <span className="text-[10px] text-gray-400 font-bold">Invite only</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Circle Description</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[2rem] font-medium text-[15px] focus:bg-white focus:border-[#ffc107] outline-none transition-all resize-none shadow-inner leading-relaxed"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full h-16 bg-black text-white rounded-[2rem] font-black text-xl hover:bg-gray-800 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100 mt-12"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <HugeiconsIcon icon={Tick01Icon} className="w-6 h-6" />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
