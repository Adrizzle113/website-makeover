import { SearchBar } from "./SearchBar";

export function HeroSection() {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 container px-4 py-20 text-center">
        <p className="text-accent-text text-white/90 uppercase tracking-widest mb-4 animate-fade-in">
          B2B Travel Platform
        </p>
        <h1 className="font-heading text-heading-very-big text-white mb-6 animate-slide-up">
          Find Your Perfect Stay
        </h1>
        <p className="text-body-large text-white/80 max-w-2xl mx-auto mb-10 animate-slide-up">
          Access exclusive rates on hotels worldwide. Search, compare, and book
          accommodations for your clients with ease.
        </p>

        {/* Search Bar */}
        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <SearchBar />
        </div>
      </div>
    </section>
  );
}
