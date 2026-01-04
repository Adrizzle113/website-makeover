import { useNavigate } from "react-router-dom";
import { CalendarDays, Users, Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBookingStore } from "@/stores/bookingStore";
import { format, differenceInDays } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface BookingSidebarProps {
  currency: string;
  hotelId: string;
}

export function BookingSidebar({ currency, hotelId }: BookingSidebarProps) {
  const navigate = useNavigate();
  const { selectedRooms, searchParams, getTotalPrice, getTotalRooms } = useBookingStore();

  const totalPrice = getTotalPrice();
  const totalRooms = getTotalRooms();

  const nights =
    searchParams?.checkIn && searchParams?.checkOut
      ? Math.max(1, differenceInDays(new Date(searchParams.checkOut), new Date(searchParams.checkIn)))
      : 1;

  // Calculate total guests from searchParams
  const totalGuests = searchParams?.guests || 2;


  const handleBookNow = () => {
    if (totalRooms === 0) {
      toast({
        title: "No rooms selected",
        description: "Please select at least one room to continue.",
        variant: "destructive",
      });
      return;
    }

    // Navigate to booking page with hotel ID
    navigate(`/booking/${hotelId}`);
  };

  return (
    <Card className="p-5 bg-card border-border sticky top-4">
      <h3 className="font-heading text-lg text-foreground mb-4">Your Selection</h3>

      {selectedRooms.length === 0 ? (
        <p className="text-muted-foreground text-sm">No room selected yet</p>
      ) : (
        <div className="space-y-4">
          {/* Selected Rooms */}
          <div className="space-y-2">
            {selectedRooms.map((room) => (
              <div key={room.roomId} className="flex justify-between items-start text-sm">
                <div>
                  <p className="font-medium text-foreground">{room.roomName}</p>
                  <p className="text-muted-foreground">x{room.quantity}</p>
                </div>
                <p className="text-foreground font-medium">
                  {currency} {Math.round(room.pricePerRoom / nights).toLocaleString()}/night
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            {/* Check-in / Check-out */}
            {searchParams && (
              <div className="flex items-start gap-3">
                <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <div className="flex gap-2">
                    <div>
                      <p className="text-muted-foreground text-xs">Check-in</p>
                      <p className="font-medium text-foreground">
                        {format(new Date(searchParams.checkIn), "MMM d, yyyy")}
                      </p>
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div>
                      <p className="text-muted-foreground text-xs">Check-out</p>
                      <p className="font-medium text-foreground">
                        {format(new Date(searchParams.checkOut), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs mt-1">
                    {nights} night{nights > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            )}

            {/* Guest Count */}
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-foreground">
                {totalGuests} guest{totalGuests > 1 ? "s" : ""}
              </p>
            </div>

            {/* Cancellation Policy - show unique policies only */}
            {[...new Set(selectedRooms.map(r => r.cancellationPolicy || "Non-refundable"))].map((policy, idx) => {
              const isRefundable = policy.toLowerCase().includes("free") || policy.toLowerCase().includes("refundable");
              return (
                <div key={`cancel-${idx}`} className="flex items-start gap-2 text-sm">
                  {isRefundable ? (
                    <>
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-green-600 font-medium">{policy}</span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{policy}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Total</span>
              <div className="text-right">
                <p className="font-heading text-xl text-primary">
                  {currency} {totalPrice.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  for {totalRooms} room{totalRooms > 1 ? "s" : ""}, {nights} night{nights > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Commission Ribbon */}
            <div className="relative -mx-5 px-5 py-2 bg-primary/10 border-y border-primary/20 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-primary">Your Commission</span>
                <span className="text-sm font-bold text-primary">
                  {currency} {(totalPrice * 0.1).toLocaleString()} (10%)
                </span>
              </div>
            </div>

            <Button
              onClick={handleBookNow}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              Book Now
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
