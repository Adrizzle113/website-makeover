import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBookingStore } from "@/stores/bookingStore";
import { format, differenceInDays } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface BookingSectionProps {
  currency: string;
}

export function BookingSection({ currency }: BookingSectionProps) {
  const navigate = useNavigate();
  const { selectedRooms, searchParams, getTotalPrice, getTotalRooms, selectedHotel } =
    useBookingStore();

  const totalPrice = getTotalPrice();
  const totalRooms = getTotalRooms();

  const nights =
    searchParams?.checkIn && searchParams?.checkOut
      ? differenceInDays(new Date(searchParams.checkOut), new Date(searchParams.checkIn))
      : 1;

  const handleBookNow = () => {
    if (totalRooms === 0) {
      toast({
        title: "No rooms selected",
        description: "Please select at least one room to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedHotel?.id) {
      toast({
        title: "Hotel not selected",
        description: "Please select a hotel first.",
        variant: "destructive",
      });
      return;
    }

    // Navigate to the dynamic booking page
    navigate(`/booking/${selectedHotel.id}`);
  };

  if (selectedRooms.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-background sticky bottom-0 z-30 border-t border-border shadow-lg">
      <div className="container">
        <Card className="p-4 md:p-6 bg-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Summary */}
            <div className="flex-1">
              <h3 className="font-heading text-heading-small text-foreground mb-2">
                Booking Summary
              </h3>
              <div className="space-y-1 text-sm">
                {selectedRooms.map((room) => (
                  <div key={room.roomId} className="flex justify-between text-muted-foreground">
                    <span>
                      {room.quantity}x {room.roomName}
                    </span>
                    <span>
                      {currency} {room.totalPrice.toLocaleString()} /night
                    </span>
                  </div>
                ))}
                {searchParams && (
                  <div className="pt-2 text-muted-foreground">
                    {format(new Date(searchParams.checkIn), "MMM d")} -{" "}
                    {format(new Date(searchParams.checkOut), "MMM d, yyyy")} ({nights}{" "}
                    night{nights > 1 ? "s" : ""})
                  </div>
                )}
              </div>
            </div>

            {/* Total & CTA */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-heading text-heading-medium text-primary">
                  {currency} {(totalPrice * nights).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  for {totalRooms} room{totalRooms > 1 ? "s" : ""}, {nights} night
                  {nights > 1 ? "s" : ""}
                </p>
              </div>
              <Button
                size="lg"
                onClick={handleBookNow}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
              >
                Book Now
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
