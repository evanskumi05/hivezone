import { createClient } from "@/utils/supabase/client";

/**
 * Finds or creates a conversation between the current user and another user.
 * Delegates to a SECURITY DEFINER SQL function to bypass RLS on insert.
 */
export async function getOrCreateConversation(otherUserId, gigId = null) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) throw new Error("Not authenticated");

    if (session.user.id === otherUserId) {
        throw new Error("Cannot start a chat with yourself");
    }

    const { data, error } = await supabase.rpc('create_conversation', {
        other_user_id: otherUserId,
        p_gig_id: gigId
    });

    if (error) {
        throw new Error(`Chat error: ${error.message} (${error.code})`);
    }

    return data; // Returns the conversation UUID directly
}
