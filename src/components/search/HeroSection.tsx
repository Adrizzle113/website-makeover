import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import heroImage from "@/assets/hero-luxury-bedroom.jpg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
export function HeroSection() {
  const scrollToResults = () => {
    const resultsSection = document.getElementById("search-results");
    resultsSection?.scrollIntoView({
      behavior: "smooth"
    });
  };
  return <section className="relative min-h-screen flex items-center justify-center px-4 py-8">
      {/* Rounded Container with Background Video */}
      <div className="absolute inset-4 md:inset-8 rounded-3xl md:rounded-[2.5rem] overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/videos/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 container text-left max-w-5xl pt-20 md:pr-80">
        <p className="heading-spaced text-white/80 mb-6 opacity-0 animate-fade-in" style={{
        animationDelay: "0.1s"
      }}>
          Premium Travel Experiences
        </p>
        <h1 className="font-heading text-display-lg text-white mb-8 opacity-0 animate-slide-up md:text-display-lg font-extralight" style={{
        animationDelay: "0.2s"
      }}>
          Turn the world into your playground!
        </h1>
        <p className="text-body-lg text-white/80 max-w-2xl mx-auto mb-10 opacity-0 animate-fade-in" style={{
        animationDelay: "0.4s"
      }}>
          Access rates 20–30% lower than TAAP, Booking.com, and HotelBeds — and keep the profit you deserve.
        </p>

        <div className="opacity-0 animate-fade-in" style={{
        animationDelay: "0.6s"
      }}>
          <Button size="lg" onClick={scrollToResults} className="bg-cream text-primary hover:bg-cream/90 rounded-full px-8 py-6 text-body-md font-semibold group">
            Book a Tour
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 hidden md:block">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-white/60 rounded-full animate-bounce" />
        </div>
      </div>

      {/* Floating Destination Card */}
      <div className="hidden md:block absolute bottom-20 right-8 lg:right-16 z-20 opacity-0 animate-fade-in" style={{
      animationDelay: "0.8s",
      animationFillMode: "forwards"
    }}>
        <div className="bg-white rounded-3xl p-3 shadow-2xl w-64 group hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
          {/* Card Image */}
          <div className="relative overflow-hidden rounded-2xl">
            <img src={heroImage} alt="Luxury Suite" className="w-full h-36 object-cover transition-transform duration-500 group-hover:scale-105" />
            <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-cream transition-colors">
              <ArrowUpRight className="w-4 h-4 text-primary" />
            </button>
          </div>
          
          {/* Card Content */}
          <div className="pt-3 pb-1 px-1">
            <h3 className="font-heading text-lg text-gray-900 mb-1">Luxury Suite</h3>
            <p className="text-sm text-gray-500">Experience premium comfort</p>
          </div>
        </div>

        {/* Social Proof */}
        <div className="flex items-center gap-3 mt-4 opacity-0 animate-fade-in" style={{
        animationDelay: "1s",
        animationFillMode: "forwards"
      }}>
          <div className="flex -space-x-2">
            <Avatar className="w-8 h-8 border-2 border-white">
              <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" />
              <AvatarFallback>U1</AvatarFallback>
            </Avatar>
            <Avatar className="w-8 h-8 border-2 border-white">
              <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" />
              <AvatarFallback>U2</AvatarFallback>
            </Avatar>
            <Avatar className="w-8 h-8 border-2 border-white">
              <AvatarImage src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100" />
              <AvatarFallback>U3</AvatarFallback>
            </Avatar>
            <Avatar className="w-8 h-8 border-2 border-white bg-primary text-white">
              <AvatarFallback className="text-xs">+5k</AvatarFallback>
            </Avatar>
          </div>
          <div className="text-white">
            <p className="text-sm font-semibold">84k+ People</p>
            <p className="text-xs text-white/70">Joined our tours</p>
          </div>
        </div>
      </div>
    </section>;
}