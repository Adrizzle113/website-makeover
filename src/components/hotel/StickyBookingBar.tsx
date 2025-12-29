import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, ArrowRight, X, Info, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBookingStore } from "@/stores/bookingStore";
import { PriceBreakdownModal } from "./PriceBreakdownModal";

interface StickyBookingBarProps {
  hotelId: string;
  hotelName: string;
  currency?: string;
}

export function StickyBookingBar({ hotelId, hotelName, currency = "USD" }: StickyBookingBarProps) {
  const navigate = useNavigate();
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const { 
    selectedRooms, 
    selectedUpsells,
    getTotalPrice, 
    getTotalRooms, 
    getTotalUpsellsPrice,
    clearRoomSelection 
  } = useBookingStore();

  const totalRooms = getTotalRooms();
  const totalPrice = getTotalPrice();
  const upsellsPrice = getTotalUpsellsPrice();
  const hasUpsells = selectedUpsells.length > 0;

  if (totalRooms === 0) {
    return null;
  }

  const handleContinue = () => {
    navigate(`/booking/${hotelId}`);
  };

  const formatCurrency = (amount: number) => {
    return currency === "USD" ? `$${amount.toLocaleString()}` : `${currency} ${amount.toLocaleString()}`;
  };

  // Group upsells by type for display
  const earlyCheckinCount = selectedUpsells.filter(u => u.type === "early_checkin").length;
  const lateCheckoutCount = selectedUpsells.filter(u => u.type === "late_checkout").length;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-fade-in">
        {/* Backdrop blur gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/80 backdrop-blur-md border-t border-border/50" />

        <div className="container relative mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Room summary */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {totalRooms} room{totalRooms !== 1 ? "s" : ""} selected
                  {hasUpsells && (
                    <span className="ml-1 text-primary">
                      + {selectedUpsells.length} add-on{selectedUpsells.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <p className="font-heading text-lg font-semibold text-foreground">
                    {formatCurrency(totalPrice)}
                    <span className="text-sm font-normal text-muted-foreground ml-1">total</span>
                  </p>
                  <button
                    onClick={() => setShowPriceBreakdown(true)}
                    className="text-primary hover:underline text-sm flex items-center gap-1"
                  >
                    <Info className="w-3 h-3" />
                    Details
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearRoomSelection}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
              <Button
                onClick={handleContinue}
                size="lg"
                className="gap-2 px-6 shadow-lg"
              >
                Continue to Book
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Room and upsell details pills */}
          {(selectedRooms.length > 0 || hasUpsells) && selectedRooms.length <= 3 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedRooms.map((room) => (
                <div
                  key={room.roomId}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 text-sm"
                >
                  <span className="font-medium text-foreground">{room.quantity}x</span>
                  <span className="text-muted-foreground truncate max-w-[200px]">
                    {room.roomName}
                  </span>
                  <span className="text-primary font-medium">
                    {formatCurrency(room.totalPrice)}
                  </span>
                </div>
              ))}
              
              {/* Upsell badges */}
              {earlyCheckinCount > 0 && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                  <Clock className="w-3 h-3 mr-1" />
                  Early Check-in × {earlyCheckinCount}
                </Badge>
              )}
              {lateCheckoutCount > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                  <Clock className="w-3 h-3 mr-1" />
                  Late Checkout × {lateCheckoutCount}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Price Breakdown Modal */}
      <PriceBreakdownModal
        open={showPriceBreakdown}
        onOpenChange={setShowPriceBreakdown}
        currency={currency}
      />
    </>
  );
}
