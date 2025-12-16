import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SearchBar } from "./SearchBar";

export function HeroSection() {
  const scrollToResults = () => {
    const resultsSection = document.getElementById("search-results");
    resultsSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-8">
      {/* Rounded Container with Background Image */}
      <div
        className="absolute inset-4 md:inset-8 rounded-3xl md:rounded-[2.5rem] overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=2000&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 container text-center max-w-5xl pt-20">
        <p 
          className="heading-spaced text-white/80 mb-6 opacity-0 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          Premium Travel Experiences
        </p>
        <h1 
          className="font-heading text-display-lg md:text-display-xl text-white mb-8 opacity-0 animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          Turn the world into your playground!
        </h1>
        <p 
          className="text-body-lg text-white/80 max-w-2xl mx-auto mb-10 opacity-0 animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          Discover breathtaking destinations and create unforgettable memories 
          with our expertly curated tour packages.
        </p>

        {/* Search Bar */}
        <div 
          className="opacity-0 animate-fade-in mb-8"
          style={{ animationDelay: "0.5s" }}
        >
          <SearchBar />
        </div>

        <div 
          className="opacity-0 animate-fade-in"
          style={{ animationDelay: "0.6s" }}
        >
          <Button 
            size="lg" 
            onClick={scrollToResults}
            className="bg-cream text-primary hover:bg-cream/90 rounded-full px-8 py-6 text-body-md font-semibold group"
          >
            Book a Tour
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-white/60 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
