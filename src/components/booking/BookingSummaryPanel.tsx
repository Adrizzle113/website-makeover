import { format, differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Users, Calendar, Check, Tag, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useBookingStore } from "@/stores/bookingStore";
import type { HotelDetails, SearchParams, RoomSelection } from "@/types/booking";

interface BookingSummaryPanelProps {
  hotel: HotelDetails;
  rooms: RoomSelection[];
  searchParams: SearchParams | null;
  totalPrice: number;
  clientPrice?: number;
  commission?: number;
}

export function BookingSummaryPanel({
  hotel,
  rooms,
  searchParams,
  totalPrice,
  clientPrice,
  commission,
}: BookingSummaryPanelProps) {
  const navigate = useNavigate();
  const { getTotalUpsellsPrice, selectedUpsells } = useBookingStore();
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [promoCode, setPromoCode] = useState("");

  const checkIn = searchParams?.checkIn ? new Date(searchParams.checkIn) : new Date();
  const checkOut = searchParams?.checkOut ? new Date(searchParams.checkOut) : new Date();
  const nights = Math.max(1, differenceInDays(checkOut, checkIn));

  const totalGuests = searchParams?.guests || rooms.reduce((sum, r) => sum + r.quantity * 2, 0);
  const childCount = searchParams?.children || 0;
  const adultCount = totalGuests - childCount;

  const roomsTotal = totalPrice;
  const upsellsTotal = getTotalUpsellsPrice();
  const netPrice = roomsTotal + upsellsTotal;
  const displayCommission = commission ?? netPrice * 0.1;
  const displayClientPrice = clientPrice ?? netPrice + displayCommission;

  // Price per night for display
  const pricePerNight = displayClientPrice / nights;

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--checkout-dark))] text-white p-6 lg:p-10">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(`/hoteldetails/${hotel.id}`)}
        className="self-start flex items-center gap-2 text-white/80 hover:text-white hover:bg-white/10 -ml-2 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </Button>

      {/* Price Hero */}
      <div className="mb-8">
        <p className="text-white/60 text-sm mb-1">Total Price</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl lg:text-5xl font-heading font-bold">
            {hotel.currency} {displayClientPrice.toFixed(2)}
          </span>
        </div>
        <p className="text-white/60 text-sm mt-1">
          {hotel.currency} {pricePerNight.toFixed(2)} per night
        </p>
      </div>

      {/* Hotel Info */}
      <div className="mb-6">
        <h2 className="font-heading text-xl font-semibold mb-1">{hotel.name}</h2>
        <div className="flex items-center gap-2">
          <div className="flex">
            {[...Array(hotel.starRating || 0)].map((_, i) => (
              <Star key={i} className="h-3 w-3 text-[hsl(var(--app-gold))] fill-current" />
            ))}
          </div>
          <span className="text-white/60 text-sm">•</span>
          <span className="text-white/60 text-sm">{hotel.city}</span>
        </div>
      </div>

      {/* Booking Details Card */}
      <div className="bg-[hsl(var(--checkout-dark-card))] rounded-xl p-5 mb-6 space-y-4">
        {/* Dates */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-white/60" />
            <div>
              <p className="text-sm font-medium">{format(checkIn, "MMM d")} - {format(checkOut, "MMM d, yyyy")}</p>
              <p className="text-xs text-white/60">{nights} night{nights > 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        {/* Guests */}
        <div className="flex items-center gap-3">
          <Users className="h-4 w-4 text-white/60" />
          <p className="text-sm">
            {adultCount} adult{adultCount !== 1 ? "s" : ""}
            {childCount > 0 && `, ${childCount} child${childCount !== 1 ? "ren" : ""}`}
          </p>
        </div>

        {/* Room */}
        <div className="pt-3 border-t border-[hsl(var(--checkout-dark-border))]">
          {rooms.map((room) => (
            <p key={room.roomId} className="text-sm">
              {room.roomName} × {room.quantity}
            </p>
          ))}
        </div>

        {/* Add-ons toggle */}
        {selectedUpsells.length > 0 && (
          <div className="pt-3 border-t border-[hsl(var(--checkout-dark-border))]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" />
                <span className="text-sm">Add-ons included</span>
              </div>
              <span className="text-sm font-medium text-green-400">
                +{hotel.currency} {upsellsTotal.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="flex-1">
        {/* Promo Code */}
        <button
          onClick={() => setPromoExpanded(!promoExpanded)}
          className="flex items-center gap-2 text-white/80 hover:text-white text-sm mb-4"
        >
          <Tag className="h-4 w-4" />
          <span>Add promotion code</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${promoExpanded ? "rotate-180" : ""}`} />
        </button>

        {promoExpanded && (
          <div className="flex gap-2 mb-4">
            <Input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter code"
              className="bg-[hsl(var(--checkout-dark-card))] border-[hsl(var(--checkout-dark-border))] text-white placeholder:text-white/40"
            />
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Apply
            </Button>
          </div>
        )}

        {/* Subtotals */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-white/60">Subtotal</span>
            <span>{hotel.currency} {netPrice.toFixed(2)}</span>
          </div>
          
          {/* Commission */}
          <div className="flex justify-between text-green-400">
            <span>Your Commission</span>
            <span>+{hotel.currency} {displayCommission.toFixed(2)}</span>
          </div>

          <div className="pt-3 border-t border-[hsl(var(--checkout-dark-border))] flex justify-between">
            <span className="font-semibold">Total due today</span>
            <span className="font-bold text-lg">{hotel.currency} {displayClientPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-8 border-t border-[hsl(var(--checkout-dark-border))]">
        <p className="text-white/40 text-xs mb-2">© 2024 Hotel Booking. All rights reserved.</p>
        <div className="flex gap-4 text-xs text-white/60">
          <a href="#" className="hover:text-white">Terms of Service</a>
          <a href="#" className="hover:text-white">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}
