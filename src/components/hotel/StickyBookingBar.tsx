import { useNavigate } from "react-router-dom";
import { ShoppingCart, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBookingStore } from "@/stores/bookingStore";

interface StickyBookingBarProps {
  hotelId: string;
  hotelName: string;
}

export function StickyBookingBar({ hotelId, hotelName }: StickyBookingBarProps) {
  const navigate = useNavigate();
  const { selectedRooms, getTotalPrice, getTotalRooms, clearRoomSelection } = useBookingStore();

  const totalRooms = getTotalRooms();
  const totalPrice = getTotalPrice();

  if (totalRooms === 0) {
    return null;
  }

  const handleContinue = () => {
    navigate(`/booking/${hotelId}`);
  };

  return (
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
              </p>
              <p className="font-heading text-lg font-semibold text-foreground">
                ${totalPrice.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground ml-1">total</span>
              </p>
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

        {/* Room details pills */}
        {selectedRooms.length > 0 && selectedRooms.length <= 3 && (
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
                  ${room.totalPrice.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
