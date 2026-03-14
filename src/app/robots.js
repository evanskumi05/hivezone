export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/admin/",
          "/api/",
          "/auth/callback",
          "/auth/onboarding",
          "/auth/update-password",
          "/auth/verified",
        ],
      },
    ],
    sitemap: "https://hivezone.co/sitemap.xml",
  };
}
