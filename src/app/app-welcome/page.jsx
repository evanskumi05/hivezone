import Link from 'next/link';

export default function AppWelcomePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-center sm:p-12">
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight font-newyork">
                Welcome to HiveZone
            </h1>
            <p className="text-lg text-gray-600 mb-10 max-w-sm mx-auto">
                Connect with peers, find local campus gigs, and thrive in your campus.
            </p>
            
            {/* Placeholder for future onboarding carousel */}
            <div className="w-full max-w-sm aspect-video sm:aspect-square bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center mb-10 mx-auto p-6 shadow-xs">
                <p className="text-gray-400 font-medium mb-4 text-sm uppercase tracking-widest">App Onboarding</p>
                <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#ffc107]"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                </div>
            </div>

            <div className="w-full max-w-sm mx-auto">
                <Link 
                    href="/auth/signin"
                    className="w-full bg-[#ffc107] hover:bg-[#e0a800] text-gray-900 font-bold py-4 px-8 rounded-full flex items-center justify-center shadow-sm transition-colors"
                >
                    Get Started
                </Link>
            </div>
        </div>
    );
}
