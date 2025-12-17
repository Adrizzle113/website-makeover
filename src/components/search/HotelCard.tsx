import { Star, MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Hotel } from "@/types/booking";
import { useBookingStore } from "@/stores/bookingStore";

interface HotelCardProps {
  hotel: Hotel;
  compact?: boolean;
}

export function HotelCard({ hotel, compact = false }: HotelCardProps) {
  const navigate = useNavigate();
  const { setSelectedHotel } = useBookingStore();

  const handleViewDetails = () => {
    navigate(`/hotel/${hotel.id}`);
  };

  if (compact) {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-card border-border/50 group rounded-xl cursor-pointer" onClick={handleViewDetails}>
        <div className="flex">
          <div className="relative w-28 h-28 flex-shrink-0 overflow-hidden">
            <img
              src={hotel.mainImage || "/placeholder.svg"}
              alt={hotel.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {hotel.reviewScore && (
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-semibold">
                {hotel.reviewScore.toFixed(1)}
              </div>
            )}
          </div>
          <div className="flex-1 p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-0.5 mb-1">
                {Array.from({ length: hotel.starRating }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <h3 className="font-heading text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {hotel.name}
              </h3>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-3 h-3 text-primary" />
                <span className="text-xs">{hotel.city}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-heading text-sm text-primary font-semibold">
                ${hotel.priceFrom}
              </p>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-card border-border/50 group rounded-2xl">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative w-full md:w-80 h-56 md:h-auto flex-shrink-0 overflow-hidden">
          <img
            src={hotel.mainImage || "/placeholder.svg"}
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {hotel.reviewScore && (
            <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-semibold">
              {hotel.reviewScore.toFixed(1)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-5 md:p-6 flex flex-col">
          <div className="flex-1">
            {/* Stars */}
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: hotel.starRating }).map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 fill-amber-400 text-amber-400"
                />
              ))}
            </div>

            {/* Name */}
            <h3 className="font-heading text-heading-standard text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {hotel.name}
            </h3>

            {/* Location */}
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-body-sm">
                {hotel.city}, {hotel.country}
              </span>
            </div>

            {/* Amenities */}
            {hotel.amenities && hotel.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {hotel.amenities.slice(0, 4).map((amenity) => (
                  <span
                    key={amenity.id}
                    className="badge-pill bg-sage/10 text-sage border-sage/20"
                  >
                    {amenity.name}
                  </span>
                ))}
                {hotel.amenities.length > 4 && (
                  <span className="badge-pill bg-muted text-muted-foreground">
                    +{hotel.amenities.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Price & CTA */}
          <div className="flex items-end justify-between pt-4 border-t border-border/50">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Starting from
              </p>
              <p className="font-heading text-heading-medium text-primary">
                {hotel.currency} {hotel.priceFrom.toLocaleString()}
              </p>
              <p className="text-body-sm text-muted-foreground">per night</p>
            </div>
            <Button
              onClick={handleViewDetails}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 group/btn"
            >
              View Details
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
