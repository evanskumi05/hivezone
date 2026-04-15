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
  allowedDevOrigins: ["10.217.45.102", "localhost", "10.0.2.2"],
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  experimental: {
    optimizePackageImports: [
      "@hugeicons/core-free-icons",
      "framer-motion",
      "recharts",
    ],
  },
};

export default nextConfig;
