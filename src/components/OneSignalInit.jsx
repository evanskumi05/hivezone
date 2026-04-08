"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { initOneSignal, loginOneSignal, logoutOneSignal } from "@/utils/OneSignalNative";

export default function OneSignalInit() {
    useEffect(() => {
        const supabase = createClient();
        const initOneSignalUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            // Initialize OneSignal (Handles both Web and Native)
            await initOneSignal();

            if (session?.user?.id) {
                try {
                    await loginOneSignal(session.user.id);
                } catch (e) {
                    // Silence OneSignal login errors
                }
            }
        };

        initOneSignalUser();

        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user?.id) {
                    try {
                        await loginOneSignal(session.user.id);
                    } catch (e) {
                        // Silence
                    }
                } else if (event === 'SIGNED_OUT') {
                    try {
                        await logoutOneSignal();
                    } catch (e) {
                        // Silence
                    }
                }
            }
        );

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    return null;
}
