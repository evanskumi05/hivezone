import Navbar from "@/components/Navbar";
import LandingPage from "@/components/LandingPage";
import Footer from "@/components/Footer";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "HiveZone",
      url: "https://hivezone.co",
      description:
        "HiveZone is a student-only platform for Ghanaian university students to find gigs, form study circles, discover internships & scholarships, and connect with peers.",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://hivezone.co/dashboard/search?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      name: "HiveZone",
      url: "https://hivezone.co",
      logo: "https://hivezone.co/logo.png",
      sameAs: ["https://instagram.com/hivezoneofficial"],
      description:
        "A student-focused digital platform designed to improve campus life across Ghanaian universities through gigs, study circles, internships, and peer support.",
      foundingDate: "2026",
      address: {
        "@type": "PostalAddress",
        addressLocality: "East Legon, Accra",
        addressCountry: "GH",
      },
    },
  ],
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <LandingPage />
      <Footer />
    </div>
  );
}
