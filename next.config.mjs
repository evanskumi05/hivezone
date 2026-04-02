/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.hivezone.co",
      },
      {
        protocol: "https",
        hostname: "emlwrjkiuzapekhdazsx.supabase.co",
      },
    ],
  },
  // Allow Capacitor (running on local IP) to connect to Next.js HMR for live reload
  allowedDevOrigins: ["10.217.45.102", "localhost", "10.0.2.2"],
};



export default nextConfig;
