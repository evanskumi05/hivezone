import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const newYork = localFont({
  src: "./fonts/newyork/newyork.otf",
  variable: "--font-newyork",
});

const manyto = localFont({
  src: [
    {
      path: "./fonts/manyto/Manyto.woff2",
      weight: "normal",
      style: "normal",
    },
    {
      path: "./fonts/manyto/Manyto.otf",
      weight: "normal",
      style: "normal",
    }
  ],
  variable: "--font-manyto",
});

export const metadata = {
  metadataBase: new URL("https://hivezone.co"),
  title: {
    default: "HiveZone | Your Campus Hub",
    template: "%s | HiveZone",
  },
  description: "HiveZone is a student-only platform for Ghanaian university students to find gigs, form study circles, discover internships & scholarships, and connect with peers. Join the hive today.",
  applicationName: "HiveZone",
  keywords: [
    "HiveZone", "student platform", "campus hub", "student gigs Ghana",
    "university gigs", "study circles", "student internships Ghana",
    "scholarships for students", "university collaboration",
    "University of Ghana", "KNUST", "student community",
    "campus hustle", "peer support", "student freelancing",
    "academic collaboration", "campus social network",
  ],
  authors: [{ name: "HiveZone Team", url: "https://hivezone.co" }],
  creator: "HiveZone",
  publisher: "HiveZone",
  alternates: {
    canonical: "https://hivezone.co",
  },
  openGraph: {
    title: "HiveZone | Student Gigs, Study Circles & More",
    description: "The student-only platform to find gigs, form study circles, discover internships, and connect with peers across Ghanaian universities.",
    url: "https://hivezone.co",
    siteName: "HiveZone",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "HiveZone – Your Campus Hub for Student Gigs, Study Circles & More",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HiveZone | Your Campus Hub",
    description: "Find gigs, form study circles, discover internships & scholarships. The student-only platform for Ghanaian universities.",
    images: ["/og-image.png"],
    creator: "@hivezone_co",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/logoIcon.svg",
    apple: "/appIcon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HiveZone",
  },
};

export const viewport = {
  colorScheme: "light",
};

import { UIProvider } from "@/components/ui/UIProvider";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ colorScheme: 'light' }}>
      <head>
        <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" strategy="afterInteractive" />
        <Script id="onesignal-init" strategy="afterInteractive">
          {`
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            OneSignalDeferred.push(async function(OneSignal) {
              try {
                OneSignal.Debug.setLogLevel("none");
                await OneSignal.init({
                  appId: "b9314dfb-651e-4f29-b1e9-c1f6f2300b0e",
                  allowLocalhostAsSecureOrigin: true,
                  notifyButton: {
                    enable: true,
                  },
                });
              } catch (e) {
                // Ignore OneSignal initialization errors (e.g., domain restriction on localhost)
              }
            });
          `}
        </Script>
      </head>
      <body
        className={`${newYork.variable} ${inter.variable} ${manyto.variable} antialiased`}
      >
        <UIProvider>
          {children}
          <Analytics />
          <SpeedInsights />
        </UIProvider>
      </body>
    </html>
  );
}
