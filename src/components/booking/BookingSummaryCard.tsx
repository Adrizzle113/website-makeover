import { format, differenceInDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Users, Calendar, Clock, Check, AlertTriangle } from "lucide-react";
import type { HotelDetails, SearchParams, RoomSelection } from "@/types/booking";

interface BookingSummaryCardProps {
  hotel: HotelDetails;
  rooms: RoomSelection[];
  searchParams: SearchParams | null;
  totalPrice: number;
  isLoading?: boolean;
  clientPrice?: number;
  commission?: number;
}

export function BookingSummaryCard({
  hotel,
  rooms,
  searchParams,
  totalPrice,
  isLoading,
  clientPrice,
  commission,
}: BookingSummaryCardProps) {
  const checkIn = searchParams?.checkIn ? new Date(searchParams.checkIn) : new Date();
  const checkOut = searchParams?.checkOut ? new Date(searchParams.checkOut) : new Date();
  const nights = differenceInDays(checkOut, checkIn) || 1;

  const totalGuests = searchParams?.guests || rooms.reduce((sum, r) => sum + r.quantity * 2, 0);
  const childCount = searchParams?.children || 0;
  const adultCount = totalGuests - childCount;

  // Mock cancellation policy - in real implementation, this comes from API
  const cancellationDate = new Date(checkIn);
  cancellationDate.setDate(cancellationDate.getDate() - 3);
  const hasFreeCancellation = cancellationDate > new Date();

  // Use provided commission or default to 10%
  const netPrice = totalPrice * nights;
  const displayCommission = commission ?? netPrice * 0.1;
  const displayClientPrice = clientPrice ?? netPrice + displayCommission;

  return (
    <Card className="border-0 shadow-lg sticky top-8">
      {/* Hotel Header */}
      <div className="bg-primary text-primary-foreground p-4 rounded-t-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < (hotel.starRating || 0)
                    ? "text-[hsl(var(--app-gold))] fill-current"
                    : "text-primary-foreground/40"
                }`}
              />
            ))}
          </div>
        </div>
        <h3 className="font-heading font-bold text-lg mb-1">{hotel.name}</h3>
        <p className="text-sm text-primary-foreground/80">
          {hotel.address}, {hotel.city}
        </p>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Check-in/Check-out */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">Check-in</p>
            </div>
            <p className="text-base font-bold text-foreground">
              {format(checkIn, "MMM d, yyyy")}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {hotel.checkInTime || "from 3:00 PM"}
              </p>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">Check-out</p>
            </div>
            <p className="text-base font-bold text-foreground">
              {format(checkOut, "MMM d, yyyy")}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {hotel.checkOutTime || "until 12:00 PM"}
              </p>
            </div>
          </div>
        </div>

        {/* Nights & Occupancy */}
        <div className="pb-4 border-b border-border">
          <p className="text-sm font-medium text-foreground mb-2">
            {nights} night{nights > 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm">
              {adultCount} adult{adultCount !== 1 ? "s" : ""}
              {childCount > 0 && `, ${childCount} child${childCount !== 1 ? "ren" : ""}`}
            </span>
          </div>
        </div>

        {/* Room Details */}
        <div className="pb-4 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">ROOM TYPE</p>
          {rooms.map((selectedRoom) => (
            <div key={selectedRoom.roomId} className="mb-2 last:mb-0">
              <p className="text-sm font-medium text-foreground">
                {selectedRoom.roomName} × {selectedRoom.quantity}
              </p>
              <p className="text-xs text-muted-foreground">
                {hotel.currency} {selectedRoom.pricePerRoom.toFixed(2)} per night
              </p>
            </div>
          ))}
        </div>

        {/* Cancellation Policy */}
        <div className="pb-4 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">CANCELLATION POLICY</p>
          {hasFreeCancellation ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Free cancellation available
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Until {format(cancellationDate, "MMM d, yyyy")} at 18:00 (UTC)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  After that, a cancellation fee applies
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-700">
                Non-refundable rate
              </p>
            </div>
          )}
        </div>

        {/* Price Summary */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              ETG Net Price ({nights} night{nights > 1 ? "s" : ""})
            </span>
            <span className="text-sm font-medium text-foreground">
              {hotel.currency} {netPrice.toFixed(2)}
            </span>
          </div>

          {/* Commission Ribbon */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 -mx-4">
            <div className="flex justify-between items-center px-4">
              <span className="text-sm text-green-700 font-medium">
                Your Commission
              </span>
              <span className="text-base font-bold text-green-600">
                + {hotel.currency} {displayCommission.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-border">
            <span className="font-semibold text-foreground">Client Price</span>
            <span className="text-xl font-bold text-primary">
              {hotel.currency} {displayClientPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
