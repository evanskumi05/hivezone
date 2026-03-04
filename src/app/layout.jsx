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
  title: "HiveZone | Your Campus Hub",
  description: "Connect with peers, find gigs, discover internships, and thrive in your campus zone.",
  applicationName: "HiveZone",
  keywords: ["campus", "university", "student gigs", "internships", "scholarships", "college"],
  authors: [{ name: "HiveZone Team" }],
  openGraph: {
    title: "HiveZone | Your Campus Hub",
    description: "Your campus, your zone, your hive. Connect with peers, find gigs, and thrive.",
    url: "https://campushive.com", // Example URL, will configure ENV later
    siteName: "HiveZone",
    images: [
      {
        url: "/logo.png", // Fallback OG image
        width: 1200,
        height: 630,
        alt: "HiveZone Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HiveZone | Your Campus Hub",
    description: "Connect with peers, find gigs, discover internships, and thrive in your campus zone.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logoIcon.svg",
    apple: "/logoIcon.svg",
  },
  manifest: "/manifest.json",
};

import { UIProvider } from "@/components/ui/UIProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${newYork.variable} ${inter.variable} ${manyto.variable} antialiased`}
      >
        <UIProvider>
          {children}
        </UIProvider>
      </body>
    </html>
  );
}
