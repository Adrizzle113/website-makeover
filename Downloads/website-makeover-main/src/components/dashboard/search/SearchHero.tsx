import { EnhancedSearchCard } from "./EnhancedSearchCard";
import { MapPin, Shield, Clock, Sparkles } from "lucide-react";

const FLOATING_TAGS = [
  { icon: MapPin, text: "1M+ Hotels", delay: "0s" },
  { icon: Shield, text: "Best Rates", delay: "0.5s" },
  { icon: Clock, text: "24/7 Support", delay: "1s" },
  { icon: Sparkles, text: "Exclusive Deals", delay: "1.5s" },
];

export function SearchHero() {
  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Background with gradient overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-accent/80"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-accent/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center min-h-full p-6 md:p-10 lg:p-16 gap-8 lg:gap-16">
        {/* Left side - Text content */}
        <div className="flex-1 max-w-xl text-center lg:text-left">
          {/* Floating tags */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-6">
            {FLOATING_TAGS.map((tag, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card/20 backdrop-blur-sm rounded-full text-primary-foreground text-sm animate-fade-in"
                style={{ animationDelay: tag.delay }}
              >
                <tag.icon className="h-3.5 w-3.5" />
                <span>{tag.text}</span>
              </div>
            ))}
          </div>

          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-primary-foreground leading-tight mb-4">
            Discover Stunning 
            <span className="block text-accent">Places Effortlessly!</span>
          </h1>
          
          <p className="text-primary-foreground/80 text-lg md:text-xl mb-8 max-w-lg mx-auto lg:mx-0">
            Search hotels worldwide with real-time availability, competitive rates, and exclusive deals for travel agents.
          </p>

          {/* Stats */}
          <div className="hidden lg:flex gap-8">
            <div>
              <p className="text-3xl font-heading text-primary-foreground">1M+</p>
              <p className="text-primary-foreground/70 text-sm">Properties</p>
            </div>
            <div>
              <p className="text-3xl font-heading text-primary-foreground">190+</p>
              <p className="text-primary-foreground/70 text-sm">Countries</p>
            </div>
            <div>
              <p className="text-3xl font-heading text-primary-foreground">24/7</p>
              <p className="text-primary-foreground/70 text-sm">Support</p>
            </div>
          </div>
        </div>

        {/* Right side - Search card */}
        <div className="w-full lg:w-auto lg:flex-shrink-0">
          <EnhancedSearchCard />
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  );
}
