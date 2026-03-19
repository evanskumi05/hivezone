import Navbar from "@/components/dashboard/Navbar";
import BottomNav from "@/components/dashboard/BottomNav";
import ScrollToTop from "@/components/dashboard/ScrollToTop";
import ChatProvider from "@/components/providers/ChatProvider";
import NotificationProvider from "@/components/providers/NotificationProvider";
import OneSignalInit from "@/components/OneSignalInit";
import PWAInstall from "@/components/PWAInstall";

export default function DashboardLayout({ children }) {
    return (
        <NotificationProvider>
            <ChatProvider>
                <OneSignalInit />
                <PWAInstall />
                <div className="min-h-screen bg-[#fcf6de] text-zinc-900 font-sans flex flex-col">
                    <ScrollToTop />
                    <Navbar />
                    <main className="flex-1 pb-20 md:pb-0">
                        {children}
                    </main>
                    <BottomNav />
                </div>
            </ChatProvider>
        </NotificationProvider>
    );
}
