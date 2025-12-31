import { format, differenceInDays } from "date-fns";
import { Calendar, Users, Star, MapPin, Clock, ChevronDown, ChevronUp } from "lucide-react";
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
      {/* Hotel Image Hero */}
      <div className="relative h-48 lg:h-56 overflow-hidden rounded-t-xl animate-fade-in">
        <img
          src={hotelImage}
          alt={hotel.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Hotel Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-center gap-1 mb-1">
            {[...Array(hotel.starRating || 0)].map((_, i) => (
              <Star
                key={i}
                className="h-3.5 w-3.5 text-yellow-400 fill-current"
              />
            ))}
          </div>
          <h3 className="font-heading text-lg font-bold line-clamp-1">{hotel.name}</h3>
          <div className="flex items-center gap-1 text-sm text-white/80 mt-1">
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1">{hotel.city}</span>
          </div>
        </div>
      </div>

      {/* Booking Details */}
      <div className="flex-1 p-5 space-y-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        {/* Dates */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {format(new Date(searchParams.checkIn), "MMM d")} - {format(new Date(searchParams.checkOut), "MMM d, yyyy")}
              </p>
              <p className="text-xs text-muted-foreground">
                {nights} night{nights > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Guests */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {guests.length} Guest{guests.length > 1 ? "s" : ""}
              </p>
              {leadGuest && (
                <p className="text-xs text-muted-foreground">
                  {leadGuest.firstName} {leadGuest.lastName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Room Details - Collapsible on mobile */}
        <div className="rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors lg:cursor-default"
          >
            <span className="text-sm font-medium text-foreground">Room Details</span>
            <span className="lg:hidden">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </button>
          
          <div className={cn(
            "transition-all duration-300 overflow-hidden",
            isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0 lg:max-h-96 lg:opacity-100"
          )}>
            <div className="p-3 space-y-2">
              {rooms.map((room, idx) => (
                <div key={room.roomId || idx} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {room.roomName} × {room.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-3" style={{ animationDelay: "0.2s" }}>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Room Total</span>
            <span className="text-foreground font-medium">
              {hotel.currency} {displayPrice.toFixed(2)}
            </span>
          </div>
          
          {priceVerified && originalPrice && originalPrice !== displayPrice && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Original Price</span>
              <span className="text-muted-foreground line-through">
                {hotel.currency} {originalPrice.toFixed(2)}
              </span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-foreground">Total</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">
                {hotel.currency} {displayPrice.toFixed(2)}
              </span>
              <p className="text-xs text-muted-foreground">
                Includes taxes & fees
              </p>
            </div>
          </div>
        </div>

        {/* Booking Reference */}
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <p className="text-xs text-muted-foreground">Booking Reference</p>
          <p className="text-sm font-mono font-medium text-foreground">{bookingId}</p>
        </div>
      </div>

      {/* Sticky CTA Button */}
      <div className="p-5 pt-0 mt-auto">
        <Button
          onClick={onConfirmBooking}
          disabled={isDisabled}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-base shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          size="lg"
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
}
