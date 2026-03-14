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
};

export default nextConfig;
