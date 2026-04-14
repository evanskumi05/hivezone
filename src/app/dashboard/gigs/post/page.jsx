"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useUI } from "@/components/ui/UIProvider";
import { createClient } from "@/utils/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
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

const categoryMap = {
    "Academic / Tutoring": "academic",
    "Creative / Design": "creative",
    "Tech / Programming": "tech",
    "Errands / Delivery": "errand",
    "Other": "other"
};

export default function PostGigPage() {
    const { showToast } = useUI();
    const router = useRouter();
    const queryClient = useQueryClient();
    const supabase = createClient();
    const fileInputRef = useRef(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("");
    const [location, setLocation] = useState("");
    const [tags, setTags] = useState("");
    const [expectedDueDate, setExpectedDueDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

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
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                showToast("Please sign in to post a gig", "error");
                return;
            }

            // Fetch school_id for filtering
            const { data: profileData } = await supabase
                .from('users')
                .select('school_id')
                .eq('id', session.user.id)
                .single();

            let imageUrl = null;
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

                imageUrl = r2PublicUrl;
            }

            const gigData = {
                title,
                description,
                price: parseFloat(price),
                category: categoryMap[category],
                location,
                tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ""),
                expected_due_date: expectedDueDate || null,
                image_url: imageUrl,
                user_id: session.user.id,
                school_id: profileData?.school_id
            };

            const { error: insertError } = await supabase
                .from('gigs')
                .insert([gigData]);

            if (insertError) throw insertError;
            
            // Invalidate caches
            queryClient.invalidateQueries({ queryKey: ['GIGS_LIST'] });
            queryClient.invalidateQueries({ queryKey: ['GIGS_RECENT'] });

            showToast("Gig published successfully!", "success");
            router.push("/dashboard/gigs");
        } catch (error) {
            console.error("Submission error:", error);
            showToast(error.message || "Failed to publish gig", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

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
                        Post a Gig
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
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Add reference image (Optional)</label>

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
                                    className="bg-white p-2 rounded-full text-red-500 hover:bg-red-50 transition-colors"
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
                                Publishing...
                            </>
                        ) : (
                            "Publish Gig"
                        )}
                    </button>
                </div>
            </form>
            {/* Spacer to clear Bottom Nav */}
            <div className="h-32 md:h-8 w-full shrink-0" />
        </div>
    );
}
