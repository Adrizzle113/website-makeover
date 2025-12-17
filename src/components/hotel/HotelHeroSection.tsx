import { Link } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HotelDetails } from "@/types/booking";

interface HotelHeroSectionProps {
  hotel: HotelDetails;
}

export function HotelHeroSection({ hotel }: HotelHeroSectionProps) {
  return (
    <section className="relative h-[400px] md:h-[500px] mx-4 md:mx-8 mt-4 md:mt-6">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center rounded-2xl overflow-hidden"
        style={{
          backgroundImage: `url('${hotel.mainImage || "/placeholder.svg"}')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20 rounded-2xl" />
      </div>

      {/* Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Search</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Hotel Info */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="container pb-8">
          {/* Stars */}
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: hotel.starRating }).map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-app-stars text-app-stars" />
            ))}
          </div>

          {/* Name */}
          <h1 className="font-heading text-heading-big md:text-heading-very-big text-white mb-3">
            {hotel.name}
          </h1>

          {/* Location */}
          <div className="flex items-center gap-2 text-white/80">
            <MapPin className="h-5 w-5" />
            <span className="text-body-large">
              {hotel.address}, {hotel.city}, {hotel.country}
            </span>
          </div>

          {/* Review Score */}
          {hotel.reviewScore && (
            <div className="flex items-center gap-3 mt-4">
              <div className="bg-primary text-primary-foreground px-3 py-1 rounded-md font-semibold">
                {hotel.reviewScore.toFixed(1)}
              </div>
              <span className="text-white/80">
                {hotel.reviewCount
                  ? `${hotel.reviewCount.toLocaleString()} reviews`
                  : "Excellent"}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
