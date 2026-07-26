
import HeroSlider from "@/components/HeroSlider";
import AboutSection from "@/components/AboutSection";
import StatsSection from "@/components/StatsSection";
import PostSection from "@/components/PostSection";
import ProductSection from "@/components/ProductSection";
import RegisterSection from "@/components/RegisterSection";
import PartnerSection from "@/components/PartnerSection";
import ContactSection from "@/components/ContactSection";
import { getProducts, getPost } from "@/services/api";
import Link from "next/link";

export default async function Home() {
  const [products, posts] = await Promise.all([
    getProducts() || [],
    getPost() || []
  ]);

  return (
    <div className="bg-[#f4f4f4] min-h-screen flex flex-col font-sans text-gray-800">

      <main className="flex-grow">
        <HeroSlider sectionsData={[]} />
        <AboutSection />
        <StatsSection />
        <RegisterSection />
        <PostSection />
        <ProductSection />
        <PartnerSection />
   


      </main>


    </div>
  );
}