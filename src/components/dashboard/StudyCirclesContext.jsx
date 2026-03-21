"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useUI } from "@/components/ui/UIProvider";

const StudyCirclesContext = createContext();

export const useStudyCircles = () => {
    const context = useContext(StudyCirclesContext);
    if (!context) {
        throw new Error("useStudyCircles must be used within a StudyCirclesProvider");
    }
    return context;
};

const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
    }).format(new Date(date));
};

export const StudyCirclesProvider = ({ children }) => {
    const supabase = createClient();
    const { showToast } = useUI();
    const [profile, setProfile] = useState(null);
    const [myCircles, setMyCircles] = useState([]);
    const [discoverCircles, setDiscoverCircles] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMyCircles = useCallback(async (userId) => {
        setLoading(true);
        const { data, error } = await supabase
            .from("study_circle_members")
            .select(`
                circle_id,
                study_circles (*)
            `)
            .eq("user_id", userId);

        if (error) {
            setLoading(false);
            return;
        }

        if (data) {
            const formatted = await Promise.all(data.map(async (item) => {
                const { count } = await supabase
                    .from("study_circle_members")
                    .select("*", { count: 'exact', head: true })
                    .eq("circle_id", item.circle_id);

                const circleInfo = Array.isArray(item.study_circles) ? item.study_circles[0] : item.study_circles;
                if (!circleInfo) return null;

                return {
                    ...circleInfo,
                    member_count: count || 0,
                    unread: 0,
                    last_message: circleInfo.last_message || "No messages yet",
                    timestamp: circleInfo.last_message_at
                        ? formatDate(circleInfo.last_message_at)
                        : formatDate(circleInfo.created_at || new Date())
                };
            }));

            const validCircles = formatted.filter(Boolean);
            const sorted = validCircles.sort((a, b) => {
                const dateA = new Date(a.last_message_at || a.created_at);
                const dateB = new Date(b.last_message_at || b.created_at);
                return dateB - dateA;
            });

            setMyCircles(sorted);
        }
        setLoading(false);
    }, [supabase]);

    const fetchDiscoverCircles = useCallback(async (userId) => {
        const { data: joinedIds } = await supabase
            .from("study_circle_members")
            .select("circle_id")
            .eq("user_id", userId);

        const joinedIdList = joinedIds?.map(j => j.circle_id) || [];

        let query = supabase.from("study_circles").select("*")
            .eq("is_private", false);

        if (joinedIdList.length > 0) {
            query = query.not("id", "in", `(${joinedIdList.join(",")})`);
        }

        const { data, error } = await query;
        if (error) return;

        if (data) {
            const formatted = await Promise.all(data.map(async (circle) => {
                const { count } = await supabase
                    .from("study_circle_members")
                    .select("*", { count: 'exact', head: true })
                    .eq("circle_id", circle.id);
                return { ...circle, member_count: count || 0 };
            }));
            setDiscoverCircles(formatted);
        }
    }, [supabase]);

    const loadUserData = useCallback(async (userId) => {
        try {
            const { data: profileData } = await supabase
                .from("users")
                .select("id")
                .eq("id", userId)
                .single();

            setProfile(profileData);
            fetchMyCircles(userId);
            fetchDiscoverCircles(userId);
        } catch (err) { }
    }, [supabase, fetchMyCircles, fetchDiscoverCircles]);

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) loadUserData(session.user.id);
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) loadUserData(session.user.id);
        });

        fetchInitialData();
        return () => subscription.unsubscribe();
    }, [supabase, loadUserData]);

    const handleJoinCircle = async (circleId) => {
        if (!profile) return;
        const { error } = await supabase
            .from("study_circle_members")
            .insert({ circle_id: circleId, user_id: profile.id });

        if (error) {
            showToast("Failed to join circle", "error");
        } else {
            showToast("Joined circle successfully!", "success");
            fetchMyCircles(profile.id);
            fetchDiscoverCircles(profile.id);
        }
    };

    const handleLeaveCircle = async (circleId) => {
        if (!profile) return;
        const { error } = await supabase
            .from("study_circle_members")
            .delete()
            .eq("circle_id", circleId)
            .eq("user_id", profile.id);

        if (error) {
            showToast("Failed to leave circle", "error");
        } else {
            showToast("Left circle successfully", "success");
            fetchMyCircles(profile.id);
            fetchDiscoverCircles(profile.id);
        }
    };

    return (
        <StudyCirclesContext.Provider value={{
            profile,
            myCircles,
            discoverCircles,
            loading,
            fetchMyCircles,
            fetchDiscoverCircles,
            handleJoinCircle,
            handleLeaveCircle,
            setMyCircles
        }}>
            {children}
        </StudyCirclesContext.Provider>
    );
};
