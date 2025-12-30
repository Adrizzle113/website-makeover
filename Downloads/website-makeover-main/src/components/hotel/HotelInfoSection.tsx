import type { HotelDetails } from "@/types/booking";
import { BookingSidebar } from "./BookingSidebar";

interface HotelInfoSectionProps {
  hotel: HotelDetails;
}

/**
 * Generates a smart fallback description using available hotel data
 */
function generateFallbackDescription(hotel: HotelDetails): string {
  const parts: string[] = [];
  
  // Star rating intro
  const starText = hotel.starRating ? `${hotel.starRating}-star` : 'premium';
  
  // Location context
  const locationParts = [hotel.city, hotel.country].filter(Boolean);
  const locationText = locationParts.length > 0 
    ? `in ${locationParts.join(', ')}` 
    : '';
  
  // Build intro sentence
  parts.push(`Welcome to ${hotel.name}, a ${starText} property${locationText ? ` ${locationText}` : ''}.`);
  
  // Amenities highlight
  if (hotel.amenities && hotel.amenities.length > 0) {
    const topAmenities = hotel.amenities.slice(0, 5).map(a => a.name);
    if (topAmenities.length > 0) {
      parts.push(`Guests enjoy ${topAmenities.join(', ')}.`);
    }
  }
  
  // Review score context
  if (hotel.reviewScore && hotel.reviewScore >= 8) {
    parts.push(`Highly rated by guests with a score of ${hotel.reviewScore.toFixed(1)}/10.`);
  } else if (hotel.reviewScore && hotel.reviewScore >= 7) {
    parts.push(`Well-reviewed by travelers with a score of ${hotel.reviewScore.toFixed(1)}/10.`);
  }
  
  // Check-in/out times if available
  if (hotel.checkInTime || hotel.checkOutTime) {
    const timeParts = [];
    if (hotel.checkInTime) timeParts.push(`check-in from ${hotel.checkInTime}`);
    if (hotel.checkOutTime) timeParts.push(`check-out by ${hotel.checkOutTime}`);
    if (timeParts.length > 0) {
      parts.push(`Convenient ${timeParts.join(' and ')}.`);
    }
  }
  
  // Generic closing
  parts.push('Experience comfort and hospitality tailored for both business and leisure travelers.');
  
  return parts.join(' ');
}

export function HotelInfoSection({ hotel }: HotelInfoSectionProps) {
  // Use API description or generate a smart fallback
  const description = hotel.fullDescription || hotel.description || generateFallbackDescription(hotel);
  
  return (
    <section className="py-8 bg-background">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Description */}
          <div className="lg:col-span-2">
            <h2 className="font-heading text-heading-standard text-foreground mb-4">
              About This Hotel
            </h2>
            <p className="text-body-large text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          {/* Booking Sidebar */}
          <div>
            <BookingSidebar currency={hotel.currency} />
          </div>
        </div>
      </div>
    </section>
  );
}
