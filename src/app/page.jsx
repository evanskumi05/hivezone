import Navbar from "@/components/Navbar";
import LandingPage from "@/components/LandingPage";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <LandingPage />
      <Footer />
    </div>
  );
}
