import { Clock, Info } from "lucide-react";
import type { HotelDetails } from "@/types/booking";

interface HotelPoliciesSectionProps {
  hotel: HotelDetails;
}

export function HotelPoliciesSection({ hotel }: HotelPoliciesSectionProps) {
  const hasCheckTimes = hotel.checkInTime || hotel.checkOutTime;
  const hasPolicies = hotel.policies && hotel.policies.length > 0;

  if (!hasCheckTimes && !hasPolicies) {
    return null;
  }

  return (
    <section className="py-8 bg-background">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Check-in/Check-out */}
          {hasCheckTimes && (
            <div className="bg-muted/50 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Check-in/out Times</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {hotel.checkInTime && (
                  <div>
                    <span className="text-muted-foreground block">Check-in</span>
                    <span className="font-medium text-foreground">{hotel.checkInTime}</span>
                  </div>
                )}
                {hotel.checkOutTime && (
                  <div>
                    <span className="text-muted-foreground block">Check-out</span>
                    <span className="font-medium text-foreground">{hotel.checkOutTime}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Policies */}
          {hasPolicies && (
            <div className="bg-muted/50 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Info className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Hotel Policies</h3>
              </div>
              <ul className="space-y-2">
                {hotel.policies!.map((policy, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {policy}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
