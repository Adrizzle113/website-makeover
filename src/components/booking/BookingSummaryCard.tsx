import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Utensils, RotateCcw, Users, AlertCircle } from "lucide-react";
import type { HotelDetails, SearchParams, RoomSelection } from "@/types/booking";

interface BookingSummaryCardProps {
  hotel: HotelDetails;
  rooms: RoomSelection[];
  searchParams: SearchParams | null;
  totalPrice: number;
}

export function BookingSummaryCard({
  hotel,
  rooms,
  searchParams,
  totalPrice,
}: BookingSummaryCardProps) {
  const [promoCode, setPromoCode] = useState("");
  const [payWithPoints, setPayWithPoints] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(hotel.currency || "USD");

  const checkIn = searchParams?.checkIn ? new Date(searchParams.checkIn) : new Date();
  const checkOut = searchParams?.checkOut ? new Date(searchParams.checkOut) : new Date();
  const nights = differenceInDays(checkOut, checkIn) || 1;

  const totalGuests = rooms.reduce(
    (sum, r) => sum + r.quantity * 2, // Default 2 guests per room
    0
  );

  // Get meal plan info from hotel rooms if available
  const hasFreeCancellation = hotel.rooms?.some((r) =>
    r.cancellationPolicy?.toLowerCase().includes("free")
  ) || false;

  const hasBreakfast = hotel.rooms?.some((r) =>
    r.mealPlan?.toLowerCase().includes("breakfast")
  ) || false;

  const commissionAmount = (totalPrice * 0.1).toFixed(2);

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

      <CardContent className="p-4">
        {/* Check-in/Check-out */}
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Check-in</p>
            <p className="text-lg font-bold text-foreground">
              {format(checkIn, "MMM d, yyyy")}
            </p>
            <p className="text-xs text-muted-foreground">
              {hotel.checkInTime || "from 3:00 PM"}
            </p>
          </div>
          <div className="w-px h-12 bg-border" />
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">Check-out</p>
            <p className="text-lg font-bold text-foreground">
              {format(checkOut, "MMM d, yyyy")}
            </p>
            <p className="text-xs text-muted-foreground">
              {hotel.checkOutTime || "until 12:00 PM"}
            </p>
          </div>
        </div>

        {/* Amenities & Policies */}
        <div className="space-y-2 mb-4">
          {hasBreakfast && (
            <div className="flex items-center gap-2 text-accent">
              <Utensils className="h-4 w-4" />
              <span className="text-sm">Breakfast included</span>
            </div>
          )}
          {hasFreeCancellation && (
            <div className="flex items-center gap-2 text-accent">
              <RotateCcw className="h-4 w-4" />
              <span className="text-sm">Free cancellation available</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-primary">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Important information</span>
          </div>
        </div>

        {/* Room Details */}
        <div className="mb-4 pb-4 border-b border-border">
          {rooms.map((selectedRoom) => (
            <div key={selectedRoom.roomId} className="mb-2 last:mb-0">
              <p className="text-sm font-medium text-foreground">
                {selectedRoom.roomName} x{selectedRoom.quantity}
              </p>
              <p className="text-sm text-muted-foreground">
                {hotel.currency} {selectedRoom.pricePerRoom.toFixed(2)} per room
              </p>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {totalGuests} guest{totalGuests > 1 ? "s" : ""} • {nights} night
              {nights > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Promo Code */}
        <div className="mb-4">
          <Input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Enter promo code"
            className="border-dashed border-primary"
          />
        </div>

        {/* Pay with Points */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="pay-points"
              checked={payWithPoints}
              onCheckedChange={(checked) => setPayWithPoints(checked as boolean)}
            />
            <label
              htmlFor="pay-points"
              className="text-sm text-foreground cursor-pointer"
            >
              Pay with points
            </label>
          </div>
          <Select defaultValue="choose">
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="choose">Choose</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Payment Total */}
        <div className="border-t border-border pt-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Currency</p>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="AED">AED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Payment total</p>
              <p className="text-2xl font-bold text-foreground">
                {selectedCurrency} {totalPrice.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Commission Ribbon */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4 -mx-4">
            <div className="flex justify-between items-center px-4">
              <span className="text-sm text-primary font-medium">
                Your Commission (10%)
              </span>
              <span className="text-lg font-bold text-primary">
                {selectedCurrency} {commissionAmount}
              </span>
            </div>
          </div>

          {/* Loyalty Points */}
          <div className="flex items-center gap-2 text-primary">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">P</span>
            </div>
            <span className="text-sm">You will get 2 points</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
