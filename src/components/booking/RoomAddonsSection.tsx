import { Card, CardContent } from "@/components/ui/card";
import { Info, Sparkles } from "lucide-react";
import { RoomUpsells } from "@/components/hotel/RoomUpsells";
import type { RoomSelection } from "@/types/booking";
import type { HotelDetails } from "@/types/booking";

interface RoomAddonsSectionProps {
  rooms: RoomSelection[];
  hotel: HotelDetails;
}

export function RoomAddonsSection({ rooms, hotel }: RoomAddonsSectionProps) {
  // Only show if we have rooms and check-in/out times (needed for upsells)
  if (!rooms.length || (!hotel.checkInTime && !hotel.checkOutTime)) {
    return null;
  }

  return (
    <Card className="border border-border/50 shadow-sm">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-semibold text-foreground">
              Enhance Your Stay
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add optional services to make your trip even better
            </p>
          </div>
        </div>

        {/* Room Upsells */}
        <div className="space-y-4">
          {rooms.map((room, index) => (
            <div 
              key={room.roomId} 
              className={rooms.length > 1 ? "pb-4 last:pb-0 last:border-0 border-b border-border/30" : ""}
            >
              {rooms.length > 1 && (
                <p className="text-sm font-medium text-foreground mb-2">
                  Room {index + 1}: {room.roomName}
                </p>
              )}
              <RoomUpsells
                roomId={room.roomId}
                roomName={room.roomName}
                currency={hotel.currency}
                checkInTime={hotel.checkInTime}
                checkOutTime={hotel.checkOutTime}
              />
            </div>
          ))}
        </div>

        {/* Availability Notice */}
        <div className="mt-6 p-3 rounded-lg bg-muted/50 border border-border/30">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Add-on services are subject to availability and will be confirmed at check-in. 
              Charges will be included in your booking total.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
