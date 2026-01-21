import { forwardRef, useState } from "react";
import { Star, MapPin, ArrowRight, Database, MapPinned } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Hotel, HotelDetails } from "@/types/booking";
import { useBookingStore } from "@/stores/bookingStore";
import { cn } from "@/lib/utils";

interface HotelCardProps {
  hotel: Hotel; // Raw hotel data (always present)
  enrichedHotel?: Hotel; // Enriched data (may be undefined)
  compact?: boolean;
  priority?: boolean; // Eager load first 6-8 images
  onHover?: (hotelId: string | null) => void;
  onFocus?: (hotelId: string) => void;
}
// Check if hotel has full enrichment data (from database) vs fallback (destination only)
const hasFullEnrichment = (hotel: Hotel): boolean => {
  const staticData = (hotel as any).ratehawk_data?.static_data;
  if (!staticData) return false;
  return !!(staticData.address || staticData.amenities?.length > 0 || staticData.description);
};

// Generate fallback amenities based on star rating when real data is unavailable
const getFallbackAmenities = (starRating: number) => {
  const amenities = [
    { id: 'wifi', name: 'Free Wi-Fi' },
  ];
  
  if (starRating >= 2) {
    amenities.push({ id: 'parking', name: 'Parking' });
  }
  
  if (starRating >= 3) {
    amenities.push({ id: 'ac', name: 'Air Conditioning' });
  }
  
  if (starRating >= 4) {
    amenities.push({ id: 'pool', name: 'Pool' });
  }
  
  if (starRating >= 5) {
    amenities.push({ id: 'spa', name: 'Spa' });
  }
  
  return amenities.slice(0, 3);
};

// Normalize image URLs - handle backend placeholder and {size} placeholders
const normalizeImageUrl = (url?: string): string => {
  if (!url) return "/placeholder.svg";
  if (url === "placeholder-hotel.jpg" || url.includes("placeholder-hotel")) {
    return "/placeholder.svg";
  }
  if (url.includes("{size}")) {
    return url.replace("{size}", "640x400");
  }
  return url;
};

// Convert Hotel to HotelDetails, preserving all existing data including ratehawk_data
const convertToHotelDetails = (hotel: Hotel): HotelDetails => ({
  ...hotel,
  images:
    hotel.images && hotel.images.length > 0
      ? hotel.images
      : hotel.mainImage
        ? [{ url: hotel.mainImage, alt: hotel.name }]
        : [],
  description: hotel.description || `Experience exceptional hospitality at ${hotel.name}.`,
  fullDescription: hotel.description
    ? `${hotel.description} Located in ${hotel.city}, ${hotel.country}.`
    : `${hotel.name} offers comfortable accommodations in ${hotel.city}, ${hotel.country}. Enjoy modern amenities and excellent service during your stay.`,
  rooms: hotel.rooms || [],
  ratehawk_data: hotel.ratehawk_data,
  reviewCount: hotel.reviewCount || 0,
  facilities: [],
  checkInTime: "3:00 PM",
  checkOutTime: "12:00 PM",
  policies: ["Check-in from 3:00 PM", "Check-out by 12:00 PM", "Credit card required for guarantee"],
});

export const HotelCard = forwardRef<HTMLDivElement, HotelCardProps>(function HotelCard(
  { hotel, enrichedHotel, compact = false, priority = false, onHover, onFocus },
  ref,
) {
  const navigate = useNavigate();
  const { setSelectedHotel, searchParams } = useBookingStore();
  const [imgLoaded, setImgLoaded] = useState(false);

  // Use enriched data if available, fall back to raw
  const displayHotel = enrichedHotel || hotel;
  const displayName = displayHotel.name;
  const displayCity = displayHotel.city;
  const displayCountry = displayHotel.country;
  const displayStars = displayHotel.starRating;
  const displayPrice = displayHotel.priceFrom;
  const displayAmenities = displayHotel.amenities;
  const displayReviewScore = displayHotel.reviewScore;
  const displayAddress = displayHotel.address;
  const displayCurrency = displayHotel.currency;

  // Image handling - use enriched image if available
  const imageUrl = normalizeImageUrl(enrichedHotel?.mainImage || hotel.mainImage);
  const hasImage = imageUrl !== "/placeholder.svg";

  const handleViewDetails = () => {
    // Ensure consistent string ID for navigation and storage
    const hotelIdString = String(hotel.id);
    const hotelDetails = convertToHotelDetails(displayHotel);

    console.log(`🏨 HotelCard - Setting hotel ${hotelIdString}:`, {
      hasRatehawkData: !!hotelDetails.ratehawk_data,
      ratehawkDataKeys: Object.keys(hotelDetails.ratehawk_data || {}),
    });

    setSelectedHotel(hotelDetails);

    const optimizedHotel = {
      ...hotelDetails,
      id: hotelIdString, // Keep the string slug ID for WorldOTA API
      ratehawk_data: hotelDetails.ratehawk_data ? {
        hid: hotelDetails.ratehawk_data.hid,              // Numeric ID for hotel/info edge function
        requested_hotel_id: hotelDetails.ratehawk_data.requested_hotel_id,
        ota_hotel_id: hotelDetails.ratehawk_data.ota_hotel_id,
        id: hotelDetails.ratehawk_data.id,                // Raw ID (may be numeric)
        hotel_id: hotelDetails.ratehawk_data.hotel_id,    // Alternative string field
        rates: hotelDetails.ratehawk_data.rates,
        room_groups: hotelDetails.ratehawk_data.room_groups,
        static_vm: hotelDetails.ratehawk_data.static_vm,
      } : undefined,
    };
    
    // CRITICAL: Include full guest breakdown with children ages for rate fetching
    // Without childrenAges, rates will be fetched for "adults only" which causes
    // incorrect_children_data errors at booking/finish
    const hotelDataPackage = {
      hotel: optimizedHotel,
      searchContext: searchParams
        ? {
            destination: searchParams.destination,
            checkin: searchParams.checkIn,
            checkout: searchParams.checkOut,
            guests: searchParams.guests,
            rooms: searchParams.rooms,
            // CRITICAL: Include children ages for proper rate fetching
            childrenAges: searchParams.childrenAges || [],
            // Also include structured guest breakdown for rate APIs
            guestsBreakdown: (() => {
              const childrenAges = searchParams.childrenAges || [];
              const totalGuests = searchParams.guests || 1;
              const adults = Math.max(1, totalGuests - childrenAges.length);
              return [{ adults, children: childrenAges }];
            })(),
          }
        : null,
      timestamp: new Date().toISOString(),
    };
    
    try {
      localStorage.setItem("selectedHotel", JSON.stringify(hotelDataPackage));
    } catch (e) {
      console.warn("Failed to cache hotel in localStorage:", e);
    }

    navigate(`/hoteldetails/${hotelIdString}`);
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
          {/* Compact Image with shimmer */}
          <div className="relative w-24 sm:w-28 h-24 sm:h-28 flex-shrink-0 overflow-hidden bg-muted">
            {(!hasImage || !imgLoaded) && (
              <div className="absolute inset-0 skeleton-shimmer" />
            )}
            {hasImage && (
              <img
                src={imageUrl}
                alt={displayName}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                onLoad={() => setImgLoaded(true)}
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                  setImgLoaded(true);
                }}
                className={cn(
                  "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500",
                  imgLoaded ? "opacity-100" : "opacity-0"
                )}
              />
            )}
            {displayReviewScore && displayReviewScore > 0 ? (
              <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-primary text-primary-foreground px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold">
                {displayReviewScore.toFixed(1)}
              </div>
            ) : (
              <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-secondary/80 backdrop-blur-sm text-muted-foreground px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs flex items-center gap-1">
                <Star className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">New</span>
              </div>
            )}
          </div>
          <div className="flex-1 p-2 sm:p-3 flex flex-col justify-between min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-0.5 mb-0.5 sm:mb-1">
                {Array.from({ length: displayStars || 0 }).map((_, i) => (
                  <Star key={i} className="w-2.5 sm:w-3 h-2.5 sm:h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <h3 className="font-heading text-xs sm:text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {displayName}
              </h3>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-primary flex-shrink-0" />
                <span className="text-[10px] sm:text-xs truncate">{displayCity}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-heading text-xs sm:text-sm text-primary font-semibold">
                {displayPrice ? `$${displayPrice.toLocaleString()}` : "Price on request"}
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
        {/* Image with shimmer overlay */}
        <div className="relative w-full sm:w-48 md:w-80 h-48 sm:h-48 md:h-[340px] flex-shrink-0 overflow-hidden bg-muted">
          {/* Shimmer overlay until image loads */}
          {(!hasImage || !imgLoaded) && (
            <div className="absolute inset-0 skeleton-shimmer" />
          )}
          
          {hasImage && (
            <img
              src={imageUrl}
              alt={displayName}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              onLoad={() => setImgLoaded(true)}
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
                setImgLoaded(true);
              }}
              className={cn(
                "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500",
                imgLoaded ? "opacity-100" : "opacity-0"
              )}
            />
          )}
          
          {/* Review score badge */}
          {displayReviewScore && displayReviewScore > 0 ? (
            <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-primary text-primary-foreground px-2 md:px-3 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-semibold">
              {displayReviewScore.toFixed(1)}
            </div>
          ) : (
            <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-secondary/80 backdrop-blur-sm text-muted-foreground px-2 md:px-3 py-1 md:py-1.5 rounded-full text-xs md:text-sm flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span>New</span>
            </div>
          )}
          
        </div>

        {/* Content */}
        <div className="flex-1 p-4 md:p-6 flex flex-col">
          <div className="flex-1">
            {/* Stars */}
            <div className="flex items-center gap-0.5 md:gap-1 mb-2 md:mb-3">
              {Array.from({ length: displayStars || 0 }).map((_, i) => (
                <Star key={i} className="w-3 md:w-4 h-3 md:h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>

            {/* Name */}
            <h3 className="font-heading text-base md:text-heading-standard text-foreground mb-1.5 md:mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {displayName}
            </h3>

            {/* Location */}
            <div className="flex flex-col gap-0.5 mb-3 md:mb-4">
              <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground">
                <MapPin className="w-3.5 md:w-4 h-3.5 md:h-4 text-primary flex-shrink-0" />
                <span className="text-xs md:text-body-sm">
                  {displayCity}{displayCity && displayCountry ? ", " : ""}{displayCountry}
                </span>
              </div>
              {displayAddress && (
                <p className="text-[10px] md:text-xs text-muted-foreground/70 ml-5 md:ml-6 line-clamp-1">
                  {displayAddress}
                </p>
              )}
            </div>

            {/* Amenities - show skeleton pills if not enriched */}
            {displayAmenities && displayAmenities.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 md:gap-2 mb-4 md:mb-5">
                {displayAmenities.slice(0, 3).map((amenity) => (
                  <span
                    key={amenity.id}
                    className="badge-pill text-[10px] md:text-xs bg-sage/10 text-sage border-sage/20 px-2 md:px-3 py-0.5 md:py-1"
                  >
                    {amenity.name}
                  </span>
                ))}
                {displayAmenities.length > 3 && (
                  <span className="badge-pill text-[10px] md:text-xs bg-muted text-muted-foreground px-2 md:px-3 py-0.5 md:py-1">
                    +{displayAmenities.length - 3} more
                  </span>
                )}
              </div>
            ) : !enrichedHotel ? (
              // Skeleton amenity pills while loading
              <div className="flex gap-2 mb-4 md:mb-5">
                <div className="h-6 w-20 rounded-full skeleton-shimmer" />
                <div className="h-6 w-16 rounded-full skeleton-shimmer" />
                <div className="h-6 w-24 rounded-full skeleton-shimmer" />
              </div>
            ) : (
              // Fallback amenities when enriched but no amenities data
              <div className="flex flex-wrap gap-1.5 md:gap-2 mb-4 md:mb-5">
                {getFallbackAmenities(displayStars || 3).map((amenity) => (
                  <span
                    key={amenity.id}
                    className="badge-pill text-[10px] md:text-xs bg-muted/50 text-muted-foreground border-muted px-2 md:px-3 py-0.5 md:py-1"
                  >
                    {amenity.name}
                  </span>
                ))}
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
                {displayPrice
                  ? `${displayCurrency || "USD"} ${displayPrice.toLocaleString()}`
                  : "Price on request"}
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