import Navbar from "@/components/dashboard/Navbar";
import BottomNav from "@/components/dashboard/BottomNav";
import ScrollToTop from "@/components/dashboard/ScrollToTop";
import ChatProvider from "@/components/providers/ChatProvider";
import NotificationProvider from "@/components/providers/NotificationProvider";
import { FeedProvider } from "@/components/providers/FeedProvider";
import OneSignalInit from "@/components/OneSignalInit";
import PWAInstall from "@/components/PWAInstall";

import { QueryProvider } from "@/components/providers/QueryProvider";

export default function DashboardLayout({ children }) {
    return (
        <QueryProvider>
            <NotificationProvider>
                <FeedProvider>
                    <ChatProvider>
                    <OneSignalInit />
                    <PWAInstall />
                    <div className="fixed inset-0 bg-[#fcf6de] text-zinc-900 font-sans flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
                        <ScrollToTop />
                        <Navbar />
                        <main id="main-scroll-area" className="flex-1 min-h-0 relative overflow-y-auto bg-[#fcf6de] flex flex-col">
                            {children}
                        </main>
                        <BottomNav />
                    </div>
                </ChatProvider>
            </FeedProvider>
        </NotificationProvider>
    </QueryProvider>
);
}
