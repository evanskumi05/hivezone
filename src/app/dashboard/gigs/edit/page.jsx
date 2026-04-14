"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useUI } from "@/components/ui/UIProvider";
import { createClient } from "@/utils/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import Skeleton from "@/components/ui/Skeleton";
import {
    ArrowLeft01Icon,
    Camera01Icon,
    Cancel01Icon
} from "@hugeicons/core-free-icons";
import CustomDropdown from "@/components/CustomDropdown";

const categories = [
    "Academic / Tutoring",
    "Creative / Design",
    "Tech / Programming",
    "Errands / Delivery",
    "Other"
];

const categoryMapInverse = {
    "academic": "Academic / Tutoring",
    "creative": "Creative / Design",
    "tech": "Tech / Programming",
    "errand": "Errands / Delivery",
    "other": "Other"
};

const categoryMap = {
    "Academic / Tutoring": "academic",
    "Creative / Design": "creative",
    "Tech / Programming": "tech",
    "Errands / Delivery": "errand",
    "Other": "other"
};

function EditGigContent() {
    const { showToast } = useUI();
    const router = useRouter();
    const searchParams = useSearchParams();
    const gid = searchParams.get("id");
    const supabase = createClient();
    const queryClient = useQueryClient();
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("");
    const [location, setLocation] = useState("");
    const [tags, setTags] = useState("");
    const [expectedDueDate, setExpectedDueDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // existing image URL from the db
    const [existingImageUrl, setExistingImageUrl] = useState(null);
    // new selected file
    const [selectedImage, setSelectedImage] = useState(null);
    // client-side preview for the new file
    const [imagePreview, setImagePreview] = useState(null);

    // user
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        if (!gid) return;

        const fetchGigBaseData = async () => {
            setLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    showToast("Please sign in to edit", "error");
                    router.push("/auth/signin");
                    return;
                }
                setCurrentUserId(session.user.id);

                const { data, error } = await supabase
                    .from('gigs')
                    .select('*')
                    .eq('id', gid)
                    .single();

                if (error) throw error;

                // Security check - only owner can edit
                if (data.user_id !== session.user.id) {
                    showToast("You are not authorized to edit this gig", "error");
                    router.push("/dashboard/gigs");
                    return;
                }

                // Populate form
                setTitle(data.title || "");
                setDescription(data.description || "");
                setPrice(data.price?.toString() || "");

                // reverse map the category string value to the UI label
                setCategory(categoryMapInverse[data.category] || "");

                setLocation(data.location || "");
                setTags(Array.isArray(data.tags) ? data.tags.join(', ') : "");
                setExpectedDueDate(data.expected_due_date || "");

                if (data.image_url) {
                    setExistingImageUrl(data.image_url);
                    setImagePreview(data.image_url); // show existing immediately
                }

            } catch (error) {
                console.error("Error fetching gig:", error);
                showToast("Failed to load gig data", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchGigBaseData();
    }, [gid, supabase, showToast, router]);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        setExistingImageUrl(null); // Also clear the old one if they hit X
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (!currentUserId || !gid) throw new Error("Missing auth context or gig id");

            let finalImageUrl = existingImageUrl;

            // Upload new image if they selected one
            if (selectedImage) {
                const fileExt = selectedImage.name.split('.').pop();
                const fileName = `gig-images/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

                // 1. Get presigned URL from our API
                const response = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fileName: fileName,
                        fileType: selectedImage.type,
                    }),
                });

                if (!response.ok) throw new Error("Failed to get upload URL");
                const { uploadUrl, publicUrl: r2PublicUrl } = await response.json();

                // 2. Upload directly to Cloudflare R2
                const uploadResponse = await fetch(uploadUrl, {
                    method: "PUT",
                    headers: { "Content-Type": selectedImage.type },
                    body: selectedImage,
                });

                if (!uploadResponse.ok) throw new Error("Failed to upload");

                finalImageUrl = r2PublicUrl;
            } else if (!imagePreview) {
                // The user explicitly removed it and didn't add a new one
                finalImageUrl = null;
            }

            const updatedGigData = {
                title,
                description,
                price: parseFloat(price),
                category: categoryMap[category],
                location,
                tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ""),
                expected_due_date: expectedDueDate || null,
                image_url: finalImageUrl,
                updated_at: new Date().toISOString()
            };

            const { data: updatedData, error: updateError } = await supabase
                .from('gigs')
                .update(updatedGigData)
                .eq('id', gid)
                .eq('user_id', currentUserId)
                .select(); // Ask Supabase to return the updated rows

            // Logging removed for production

            if (updateError) throw updateError;
            
            // Invalidate caches
            queryClient.invalidateQueries({ queryKey: ['GIGS_LIST'] });
            queryClient.invalidateQueries({ queryKey: ['GIGS_RECENT'] });
            queryClient.invalidateQueries({ queryKey: ['GIG_DETAIL', gid] });

            if (!updatedData || updatedData.length === 0) {
                throw new Error("Failed to update: You may not have permission or the gig does not exist.");
            }

            showToast("Gig updated successfully!", "success");
            router.push(`/dashboard/gigs/detail?id=${gid}`);
        } catch (error) {
            console.error("Update error:", error);
            showToast(error.message || "Failed to update gig", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col h-full bg-[#fcf6de] p-4 sm:p-8 pt-0 max-w-[800px] mx-auto w-full">
                <div className="flex items-center gap-4 mt-4 mb-8">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <Skeleton className="w-48 h-10 rounded-full" />
                </div>
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col gap-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-40 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#fcf6de] p-4 sm:p-8 pt-0 max-w-[800px] mx-auto w-full">

            {/* Header */}
            <div className="flex items-center gap-4 mt-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5 text-gray-700" />
                </button>
                <div>
                    <h1 className="text-3xl font-black tracking-wide font-newyork text-gray-900">
                        Edit Gig
                    </h1>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col gap-6">

                {/* Title */}
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Gig Title</label>
                    <input
                        type="text"
                        placeholder="e.g., Graphic Design for Event Flyer"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-transparent border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#ffc107] transition-colors"
                        required
                        disabled={isSubmitting}
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                    <textarea
                        placeholder="Describe what you need done in detail..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="w-full bg-transparent border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#ffc107] transition-colors resize-none"
                        required
                        disabled={isSubmitting}
                    />
                </div>

                {/* Price & Category Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div className="flex flex-col">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Budget / Price (¢)</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full bg-transparent border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#ffc107] transition-colors"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="flex flex-col">
                        <CustomDropdown
                            label="Category"
                            options={categories}
                            value={category}
                            onChange={(val) => setCategory(val)}
                            placeholder="Select a category"
                        />
                    </div>
                </div>

                {/* Location & Tags Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Location</label>
                        <input
                            type="text"
                            placeholder="e.g., Campus Library or Remote"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full bg-transparent border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#ffc107] transition-colors"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Tags (comma-separated)</label>
                        <input
                            type="text"
                            placeholder="e.g., React, Logo, Physics"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="w-full bg-transparent border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#ffc107] transition-colors"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Expected Due Date</label>
                        <input
                            type="date"
                            value={expectedDueDate}
                            onChange={(e) => setExpectedDueDate(e.target.value)}
                            className="w-full bg-transparent border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#ffc107] transition-colors text-gray-700"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                {/* Cover Image Upload */}
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Reference image (Optional)</label>

                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                    />

                    {!imagePreview ? (
                        <div
                            onClick={() => !isSubmitting && fileInputRef.current.click()}
                            className={`w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-[#ffc107] hover:border-[#ffc107] hover:bg-yellow-50/50 transition-colors cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <HugeiconsIcon icon={Camera01Icon} className="w-8 h-8 mb-2" />
                            <span className="text-sm font-medium">Click to upload image</span>
                        </div>
                    ) : (
                        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 group">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="bg-white p-2 rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-lg"
                                >
                                    <HugeiconsIcon icon={Cancel01Icon} className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit area */}
                <div className="flex justify-end pt-4 mt-2 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 text-sm font-bold text-gray-600 hover:text-black mr-4 transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-black text-white hover:bg-gray-800 font-semibold text-sm px-10 py-3 rounded-full transition-all active:scale-95 shadow-sm disabled:opacity-70 disabled:active:scale-100 flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function EditGigPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen bg-[#fcf6de]">
                <div className="w-12 h-12 border-4 border-[#ffc107]/30 border-t-[#ffc107] rounded-full animate-spin" />
            </div>
        }>
            <EditGigContent />
        </Suspense>
    );
}
