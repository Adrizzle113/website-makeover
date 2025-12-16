import { Clock, Info } from "lucide-react";
import type { HotelDetails } from "@/types/booking";

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

          {/* Quick Info */}
          <div className="space-y-6">
            {/* Check-in/Check-out */}
            {(hotel.checkInTime || hotel.checkOutTime) && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Check-in/out Times</h3>
                </div>
                <div className="space-y-2 text-body-small">
                  {hotel.checkInTime && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check-in</span>
                      <span className="font-medium">{hotel.checkInTime}</span>
                    </div>
                  )}
                  {hotel.checkOutTime && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check-out</span>
                      <span className="font-medium">{hotel.checkOutTime}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Policies */}
            {hotel.policies && hotel.policies.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Hotel Policies</h3>
                </div>
                <ul className="space-y-2">
                  {hotel.policies.map((policy, idx) => (
                    <li key={idx} className="text-body-small text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {policy}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
