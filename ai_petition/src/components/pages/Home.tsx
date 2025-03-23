import { useEffect } from "react";
import Navbar from "@/components/ui/Navbar";
import Hero from "@/components/section/Hero";
import Features from "@/components/section/Features";
import Testimonials from "@/components/section/Testimonial";
import Footer from "@/components/ui/Footer";

const Home = () => {
  useEffect(() => {
    // Ensure the page scrolls to top on load
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
};

export default Home;