/**
 * Reusable Skeleton loader component.
 * Usage: <Skeleton className="h-4 w-32 rounded-full" />
 */
export default function Skeleton({ className = "" }) {
    return (
        <div className={`bg-gray-200 rounded-lg ${className}`} />
    );
}

/** Pre-built skeleton for a conversation list item */
export function ConversationSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4">
            <Skeleton className="size-14 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-32 rounded-full" />
                    <Skeleton className="h-3 w-10 rounded-full" />
                </div>
                <Skeleton className="h-3 w-48 rounded-full" />
            </div>
        </div>
    );
}

/** Pre-built skeleton for a chat message bubble */
export function MessageSkeleton({ isMe = false }) {
    return (
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
            <Skeleton className={`h-10 rounded-[1.5rem] ${isMe ? 'w-48 rounded-tr-none' : 'w-56 rounded-tl-none'}`} />
        </div>
    );
}

/** Pre-built skeleton for a gig card */
export function GigCardSkeleton() {
    return (
        <div className="bg-white rounded-[2rem] p-5 border border-gray-100 space-y-3">
            <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-28 rounded-full" />
                    <Skeleton className="h-3 w-20 rounded-full" />
                </div>
            </div>
            <Skeleton className="h-5 w-3/4 rounded-full" />
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-2/3 rounded-full" />
            <div className="flex justify-between items-center pt-1">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="size-10 rounded-full" />
            </div>
        </div>
    );
}

/** Pre-built skeleton for a public profile page */
export function ProfileSkeleton() {
    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            {/* Cover + Avatar */}
            <Skeleton className="h-40 w-full rounded-[2rem]" />
            <div className="flex items-end gap-4 -mt-12 px-4">
                <Skeleton className="size-24 rounded-full border-4 border-white shrink-0" />
                <div className="flex-1 space-y-2 pb-2">
                    <Skeleton className="h-5 w-40 rounded-full" />
                    <Skeleton className="h-4 w-28 rounded-full" />
                </div>
            </div>
            {/* Bio */}
            <div className="space-y-2 px-4">
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-3/4 rounded-full" />
            </div>
            {/* Stats row */}
            <div className="flex gap-6 px-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-1">
                        <Skeleton className="h-5 w-10 rounded-full" />
                        <Skeleton className="h-3 w-14 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Pre-built skeleton for a feed post */
export function FeedPostSkeleton() {
    return (
        <div className="flex gap-4 p-5 sm:p-6 border-b border-gray-100 bg-white rounded-[1.5rem] mb-2 shadow-sm">
            <Skeleton className="size-12 rounded-full shrink-0" />
            <div className="flex-1 space-y-3">
                <div className="flex gap-2 items-center">
                    <Skeleton className="h-4 w-32 rounded-full" />
                    <Skeleton className="h-3.5 w-20 rounded-full opacity-50" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full rounded-full" />
                    <Skeleton className="h-4 w-2/3 rounded-full" />
                </div>
                {/* Media Placeholder */}
                <Skeleton className="w-full aspect-[4/5] rounded-[1.2rem] mt-4" />
                
                <div className="flex gap-8 pt-4">
                    <Skeleton className="h-4 w-12 rounded-full" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                </div>
            </div>
        </div>
    );
}

/** Generic full-page centered skeleton for settings/simple pages */
export function PageSkeleton() {
    return (
        <div className="max-w-lg mx-auto p-6 space-y-5">
            <Skeleton className="h-8 w-48 rounded-full" />
            {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-3.5 w-24 rounded-full" />
                    <Skeleton className="h-12 w-full rounded-2xl" />
                </div>
            ))}
            <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
    );
}
