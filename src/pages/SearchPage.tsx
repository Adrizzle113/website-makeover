import {
  HeroSection,
  AboutSection,
  TourPackagesSection,
  ServicesSection,
  InstagramSection,
  TestimonialSection,
  FAQSection,
} from "@/components/search";
import { Header } from "@/components/layout/Header";

const SearchPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <AboutSection />
        <TourPackagesSection />
        <ServicesSection />
        <InstagramSection />
        <TestimonialSection />
        <FAQSection />
      </main>
    </div>
  );
};

export default SearchPage;
