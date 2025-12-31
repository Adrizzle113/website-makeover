import { format, differenceInDays } from "date-fns";
import { Calendar, Users, Star, MapPin, ChevronDown, ChevronUp, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { PendingBookingData } from "@/types/etgBooking";

interface PaymentSummaryPanelProps {
  bookingData: PendingBookingData;
  displayPrice: number;
  originalPrice?: number;
  priceVerified?: boolean;
  bookingId: string;
  onConfirmBooking: () => void;
  isProcessing: boolean;
  isDisabled: boolean;
  buttonText: string;
  className?: string;
}

export function PaymentSummaryPanel({
  bookingData,
  displayPrice,
  originalPrice,
  priceVerified,
  bookingId,
  onConfirmBooking,
  isProcessing,
  isDisabled,
  buttonText,
  className,
}: PaymentSummaryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const { hotel, rooms, guests, searchParams } = bookingData;
  const leadGuest = guests.find((g) => g.isLead);
  const nights = searchParams?.checkIn && searchParams?.checkOut
    ? differenceInDays(new Date(searchParams.checkOut), new Date(searchParams.checkIn))
    : 1;

  const hotelImage = hotel.mainImage || "/placeholder.svg";

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Hotel Image Hero - Explo Style */}
      <div className="relative h-56 lg:h-64 overflow-hidden">
        <img
          src={hotelImage}
          alt={hotel.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        {/* Hotel Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex items-center gap-1 mb-2">
            {[...Array(hotel.starRating || 0)].map((_, i) => (
              <Star
                key={i}
                className="h-4 w-4 text-gold fill-current"
              />
            ))}
          </div>
          <h3 className="font-heading text-heading-lg text-white line-clamp-1">{hotel.name}</h3>
          <div className="flex items-center gap-2 text-body-sm text-white/80 mt-2">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{hotel.city}, {hotel.country}</span>
          </div>
        </div>
      </div>

      {/* Booking Details */}
      <div className="flex-1 p-6 space-y-5">
        {/* Dates & Guests Pills */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 badge-pill bg-secondary text-secondary-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-body-sm font-medium">
              {format(new Date(searchParams.checkIn), "MMM d")} - {format(new Date(searchParams.checkOut), "MMM d")}
            </span>
          </div>
          <div className="flex items-center gap-2 badge-pill bg-secondary text-secondary-foreground">
            <Users className="h-4 w-4" />
            <span className="text-body-sm font-medium">
              {guests.length} Guest{guests.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Room Details - Collapsible */}
        <div className="rounded-2xl border border-border overflow-hidden">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <span className="text-body-sm font-medium text-foreground">Room Details</span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          <div className={cn(
            "transition-all duration-300 overflow-hidden",
            isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}>
            <div className="p-4 space-y-3 bg-muted/10">
              {rooms.map((room, idx) => (
                <div key={room.roomId || idx} className="flex justify-between items-center">
                  <span className="text-body-sm text-foreground">
                    {room.roomName}
                  </span>
                  <span className="badge-pill bg-muted text-muted-foreground text-xs">
                    × {room.quantity}
                  </span>
                </div>
              ))}
              <div className="pt-2 text-body-sm text-muted-foreground">
                {nights} night{nights > 1 ? "s" : ""} • {leadGuest?.firstName} {leadGuest?.lastName}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-4">
          <div className="flex justify-between text-body-sm">
            <span className="text-muted-foreground">Room Total ({nights} night{nights > 1 ? "s" : ""})</span>
            <span className="text-foreground font-medium">
              {hotel.currency} {displayPrice.toFixed(2)}
            </span>
          </div>
          
          {priceVerified && originalPrice && originalPrice !== displayPrice && (
            <div className="flex justify-between text-body-sm">
              <span className="text-muted-foreground">Original Price</span>
              <span className="text-muted-foreground line-through">
                {hotel.currency} {originalPrice.toFixed(2)}
              </span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between items-center">
            <div>
              <span className="font-heading text-heading-sm text-foreground">Total</span>
              <p className="text-body-sm text-muted-foreground mt-1">
                Includes taxes & fees
              </p>
            </div>
            <div className="text-right">
              <span className="font-heading text-heading-xl text-primary">
                {hotel.currency} {displayPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* CTA Button - Explo Style */}
      <div className="p-6 pt-0 mt-auto">
        <Button
          onClick={onConfirmBooking}
          disabled={isDisabled}
          className="w-full bg-cream text-primary hover:bg-cream/90 rounded-full py-7 text-body-md font-semibold shadow-soft transition-all duration-300 hover:shadow-card hover:scale-[1.02] active:scale-[0.98] group"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              {buttonText}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
