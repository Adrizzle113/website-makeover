import { Star, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Hotel } from "@/types/booking";
import { useBookingStore } from "@/stores/bookingStore";

interface HotelCardProps {
  hotel: Hotel;
}

export function HotelCard({ hotel }: HotelCardProps) {
  const navigate = useNavigate();
  const { setSelectedHotel } = useBookingStore();

  const handleViewDetails = () => {
    navigate(`/hotel/${hotel.id}`);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-card border-border group">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative w-full md:w-72 h-48 md:h-auto flex-shrink-0 overflow-hidden">
          <img
            src={hotel.mainImage || "/placeholder.svg"}
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {hotel.reviewScore && (
            <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-2 py-1 rounded-md text-sm font-semibold">
              {hotel.reviewScore.toFixed(1)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 md:p-5 flex flex-col">
          <div className="flex-1">
            {/* Stars */}
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: hotel.starRating }).map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 fill-app-stars text-app-stars"
                />
              ))}
            </div>

            {/* Name */}
            <h3 className="font-heading text-heading-small text-foreground mb-2 line-clamp-2">
              {hotel.name}
            </h3>

            {/* Location */}
            <div className="flex items-center gap-1 text-muted-foreground mb-3">
              <MapPin className="w-4 h-4" />
              <span className="text-body-small">
                {hotel.city}, {hotel.country}
              </span>
            </div>

            {/* Amenities */}
            {hotel.amenities && hotel.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {hotel.amenities.slice(0, 4).map((amenity) => (
                  <span
                    key={amenity.id}
                    className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full"
                  >
                    {amenity.name}
                  </span>
                ))}
                {hotel.amenities.length > 4 && (
                  <span className="text-xs px-2 py-1 text-muted-foreground">
                    +{hotel.amenities.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Price & CTA */}
          <div className="flex items-end justify-between pt-3 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                From
              </p>
              <p className="font-heading text-heading-standard text-primary">
                {hotel.currency} {hotel.priceFrom.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">per night</p>
            </div>
            <Button
              onClick={handleViewDetails}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              View Details
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
