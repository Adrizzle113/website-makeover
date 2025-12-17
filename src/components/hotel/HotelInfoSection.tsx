import type { HotelDetails } from "@/types/booking";
import { BookingSidebar } from "./BookingSidebar";

interface HotelInfoSectionProps {
  hotel: HotelDetails;
}

export function HotelInfoSection({ hotel }: HotelInfoSectionProps) {
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
              {hotel.fullDescription || hotel.description || 
                "Experience exceptional hospitality at this carefully selected property. Enjoy modern amenities, comfortable accommodations, and prime location perfect for both business and leisure travelers."}
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
