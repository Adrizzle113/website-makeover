import { forwardRef } from "react";
import { Star, MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Hotel } from "@/types/booking";
import { useBookingStore } from "@/stores/bookingStore";

interface HotelCardProps {
  hotel: Hotel;
  compact?: boolean;
  onHover?: (hotelId: string | null) => void;
  onFocus?: (hotelId: string) => void;
}

export const HotelCard = forwardRef<HTMLDivElement, HotelCardProps>(
  function HotelCard({ hotel, compact = false, onHover, onFocus }, ref) {
  const navigate = useNavigate();
  const { setSelectedHotel } = useBookingStore();

  const handleViewDetails = () => {
    navigate(`/hotel/${hotel.id}`);
  };

  const handleClick = () => {
    if (onFocus) {
      onFocus(hotel.id);
    } else {
      handleViewDetails();
    }
  };

  if (compact) {
    return (
      <Card 
        className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-card border-border/50 group rounded-xl cursor-pointer" 
        onClick={handleClick}
        onMouseEnter={() => onHover?.(hotel.id)}
        onMouseLeave={() => onHover?.(null)}
      >
        <div className="flex">
          <div className="relative w-24 sm:w-28 h-24 sm:h-28 flex-shrink-0 overflow-hidden">
            <img
              src={hotel.mainImage || "/placeholder.svg"}
              alt={hotel.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {hotel.reviewScore && (
              <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-primary text-primary-foreground px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold">
                {hotel.reviewScore.toFixed(1)}
              </div>
            )}
          </div>
          <div className="flex-1 p-2 sm:p-3 flex flex-col justify-between min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-0.5 mb-0.5 sm:mb-1">
                {Array.from({ length: hotel.starRating }).map((_, i) => (
                  <Star key={i} className="w-2.5 sm:w-3 h-2.5 sm:h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <h3 className="font-heading text-xs sm:text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {hotel.name}
              </h3>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-primary flex-shrink-0" />
                <span className="text-[10px] sm:text-xs truncate">{hotel.city}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-heading text-xs sm:text-sm text-primary font-semibold">
                ${hotel.priceFrom}
              </p>
              <ArrowRight className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-card border-border/50 group rounded-xl md:rounded-2xl">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="relative w-full sm:w-48 md:w-80 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
          <img
            src={hotel.mainImage || "/placeholder.svg"}
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {hotel.reviewScore && (
            <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-primary text-primary-foreground px-2 md:px-3 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-semibold">
              {hotel.reviewScore.toFixed(1)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 md:p-6 flex flex-col">
          <div className="flex-1">
            {/* Stars */}
            <div className="flex items-center gap-0.5 md:gap-1 mb-2 md:mb-3">
              {Array.from({ length: hotel.starRating }).map((_, i) => (
                <Star
                  key={i}
                  className="w-3 md:w-4 h-3 md:h-4 fill-amber-400 text-amber-400"
                />
              ))}
            </div>

            {/* Name */}
            <h3 className="font-heading text-base md:text-heading-standard text-foreground mb-1.5 md:mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {hotel.name}
            </h3>

            {/* Location */}
            <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground mb-3 md:mb-4">
              <MapPin className="w-3.5 md:w-4 h-3.5 md:h-4 text-primary flex-shrink-0" />
              <span className="text-xs md:text-body-sm">
                {hotel.city}, {hotel.country}
              </span>
            </div>

            {/* Amenities */}
            {hotel.amenities && hotel.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1.5 md:gap-2 mb-4 md:mb-5">
                {hotel.amenities.slice(0, 3).map((amenity) => (
                  <span
                    key={amenity.id}
                    className="badge-pill text-[10px] md:text-xs bg-sage/10 text-sage border-sage/20 px-2 md:px-3 py-0.5 md:py-1"
                  >
                    {amenity.name}
                  </span>
                ))}
                {hotel.amenities.length > 3 && (
                  <span className="badge-pill text-[10px] md:text-xs bg-muted text-muted-foreground px-2 md:px-3 py-0.5 md:py-1">
                    +{hotel.amenities.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Price & CTA */}
          <div className="flex items-end justify-between pt-3 md:pt-4 border-t border-border/50 gap-3">
            <div>
              <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider mb-0.5 md:mb-1">
                Starting from
              </p>
              <p className="font-heading text-lg md:text-heading-medium text-primary">
                {hotel.currency} {hotel.priceFrom.toLocaleString()}
              </p>
              <p className="text-[10px] md:text-body-sm text-muted-foreground">per night</p>
            </div>
            <Button
              onClick={handleViewDetails}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 md:px-6 text-xs md:text-sm group/btn"
            >
              <span className="hidden sm:inline">View Details</span>
              <span className="sm:hidden">View</span>
              <ArrowRight className="ml-1.5 md:ml-2 h-3.5 md:h-4 w-3.5 md:w-4 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
});
