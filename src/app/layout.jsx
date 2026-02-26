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
  title: "HiveZone",
  description: "Your campus, your zone, your hive",
  icons: {
    icon: "/logoIcon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${newYork.variable} ${manyto.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
