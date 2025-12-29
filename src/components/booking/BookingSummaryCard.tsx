import { format, differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, Users, Calendar, Clock, Check, AlertTriangle, 
  ChevronDown, ChevronUp, X, Sun, Moon, ExternalLink 
} from "lucide-react";
import { useState } from "react";
import { useBookingStore, type SelectedUpsell } from "@/stores/bookingStore";
import type { HotelDetails, SearchParams, RoomSelection } from "@/types/booking";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  const navigate = useNavigate();
  const { selectedUpsells, removeUpsell, getTotalUpsellsPrice } = useBookingStore();
  const [isPolicyExpanded, setIsPolicyExpanded] = useState(false);

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

  // Calculate prices
  const roomsTotal = totalPrice * nights;
  const upsellsTotal = getTotalUpsellsPrice();
  const netPrice = roomsTotal + upsellsTotal;
  const displayCommission = commission ?? netPrice * 0.1;
  const displayClientPrice = clientPrice ?? netPrice + displayCommission;

  const handleRemoveUpsell = (upsell: SelectedUpsell) => {
    removeUpsell(upsell.id, upsell.roomId);
  };

  return (
    <Card className="border-0 shadow-lg sticky top-8">
      {/* Hotel Image */}
      {hotel.mainImage && (
        <div 
          className="relative h-32 overflow-hidden rounded-t-lg cursor-pointer group"
          onClick={() => navigate(`/hoteldetails/${hotel.id}`)}
        >
          <img 
            src={hotel.mainImage} 
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-white/80 text-xs">
            <ExternalLink className="h-3 w-3" />
            <span>View hotel</span>
          </div>
        </div>
      )}

      {/* Hotel Header */}
      <div className="bg-primary text-primary-foreground p-4">
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

        {/* Upsells Section */}
        {selectedUpsells.length > 0 && (
          <div className="pb-4 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">ADD-ONS</p>
            <div className="space-y-2">
              {selectedUpsells.map((upsell) => (
                <div 
                  key={`${upsell.id}-${upsell.roomId}`}
                  className="flex items-center justify-between p-2 bg-primary/5 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {upsell.type === "early_checkin" ? (
                      <Sun className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Moon className="h-4 w-4 text-indigo-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{upsell.name}</p>
                      {upsell.newTime && (
                        <p className="text-xs text-muted-foreground">
                          {upsell.type === "early_checkin" ? "Check-in from" : "Check-out until"} {upsell.newTime}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary">
                      +{hotel.currency} {upsell.price.toFixed(2)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveUpsell(upsell)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cancellation Policy */}
        <Collapsible open={isPolicyExpanded} onOpenChange={setIsPolicyExpanded}>
          <div className="pb-4 border-b border-border">
            <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
              <p className="text-xs font-medium text-muted-foreground">CANCELLATION POLICY</p>
              {isPolicyExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            
            <div className="mt-2">
              {hasFreeCancellation ? (
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
              ) : (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-700">
                    Non-refundable rate
                  </p>
                </div>
              )}
            </div>

            <CollapsibleContent className="mt-3 pt-3 border-t border-border/50">
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  <strong className="text-foreground">Before {format(cancellationDate, "MMM d")}:</strong> Free cancellation
                </p>
                <p>
                  <strong className="text-foreground">After {format(cancellationDate, "MMM d")}:</strong> 100% of booking charged
                </p>
                <p className="text-xs text-muted-foreground/70 mt-2">
                  All times shown are in UTC+0
                </p>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Price Summary */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Room ({nights} night{nights > 1 ? "s" : ""})
            </span>
            <span className="text-sm font-medium text-foreground">
              {hotel.currency} {roomsTotal.toFixed(2)}
            </span>
          </div>

          {upsellsTotal > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Add-ons
              </span>
              <span className="text-sm font-medium text-foreground">
                {hotel.currency} {upsellsTotal.toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-border/50">
            <span className="text-sm text-muted-foreground">
              Wholesale Price
            </span>
            <span className="text-sm font-medium text-foreground">
              {hotel.currency} {netPrice.toFixed(2)}
            </span>
          </div>

          {/* Commission Ribbon */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 -mx-4 dark:bg-green-950/30 dark:border-green-800">
            <div className="flex justify-between items-center px-4">
              <span className="text-sm text-green-700 font-medium dark:text-green-300">
                Your Commission
              </span>
              <span className="text-base font-bold text-green-600 dark:text-green-400">
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
