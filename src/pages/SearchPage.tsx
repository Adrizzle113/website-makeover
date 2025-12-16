import {
  HeroSection,
  SearchResultsSection,
  WhyChooseUsSection,
  CallToActionSection,
} from "@/components/search";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const SearchPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <SearchResultsSection />
        <WhyChooseUsSection />
        <CallToActionSection />
      </main>
      <Footer />
    </div>
  );
};

export default SearchPage;
