import {
  HeroSection,
  SearchResultsSection,
  AboutSection,
  DestinationsSection,
  TourPackagesSection,
  ServicesSection,
  InstagramSection,
  TestimonialSection,
  BlogSection,
  FAQSection,
  ContactSection,
  CallToActionSection,
} from "@/components/search";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const SearchPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <SearchResultsSection />
        <AboutSection />
        <DestinationsSection />
        <TourPackagesSection />
        <ServicesSection />
        <InstagramSection />
        <TestimonialSection />
        <BlogSection />
        <FAQSection />
        <ContactSection />
        <CallToActionSection />
      </main>
      <Footer />
    </div>
  );
};

export default SearchPage;
