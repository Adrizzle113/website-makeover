import { useState } from "react";
import { Plus, Minus, Users, Bed, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RoomRate } from "@/types/booking";
import { useBookingStore } from "@/stores/bookingStore";

interface RoomSelectionSectionProps {
  rooms: RoomRate[];
  currency: string;
}

export function RoomSelectionSection({ rooms, currency }: RoomSelectionSectionProps) {
  const { selectedRooms, addRoom, updateRoomQuantity, removeRoom } = useBookingStore();

  const getSelectedQuantity = (roomId: string) => {
    const selected = selectedRooms.find((r) => r.roomId === roomId);
    return selected?.quantity || 0;
  };

  const handleIncrease = (room: RoomRate) => {
    const currentQty = getSelectedQuantity(room.id);
    if (currentQty === 0) {
      addRoom({
        roomId: room.id,
        roomName: room.name,
        quantity: 1,
        pricePerRoom: room.price,
        totalPrice: room.price,
      });
    } else {
      updateRoomQuantity(room.id, currentQty + 1);
    }
  };

  const handleDecrease = (room: RoomRate) => {
    const currentQty = getSelectedQuantity(room.id);
    if (currentQty > 0) {
      updateRoomQuantity(room.id, currentQty - 1);
    }
  };

  if (!rooms || rooms.length === 0) {
    return (
      <section className="py-8 bg-app-white-smoke">
        <div className="container">
          <h2 className="font-heading text-heading-standard text-foreground mb-6">
            Available Rooms
          </h2>
          <p className="text-muted-foreground">No rooms available for the selected dates.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-app-white-smoke">
      <div className="container">
        <h2 className="font-heading text-heading-standard text-foreground mb-6">
          Select Your Rooms
        </h2>

        <div className="space-y-4">
          {rooms.map((room) => {
            const selectedQty = getSelectedQuantity(room.id);
            const isSelected = selectedQty > 0;

            return (
              <Card
                key={room.id}
                className={`p-4 md:p-6 transition-all ${
                  isSelected ? "border-primary ring-1 ring-primary" : "border-border"
                }`}
              >
                <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
                  {/* Room Info */}
                  <div className="flex-1">
                    <h3 className="font-heading text-heading-small text-foreground mb-2">
                      {room.name}
                    </h3>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>Max {room.maxOccupancy} guests</span>
                      </div>
                      {room.bedType && (
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          <span>{room.bedType}</span>
                        </div>
                      )}
                    </div>

                    {room.amenities && room.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {room.amenities.slice(0, 5).map((amenity, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-xs text-primary"
                          >
                            <Check className="h-3 w-3" />
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}

                    {room.mealPlan && (
                      <p className="text-sm text-primary font-medium">{room.mealPlan}</p>
                    )}

                    {room.cancellationPolicy && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {room.cancellationPolicy}
                      </p>
                    )}
                  </div>

                  {/* Price & Selection */}
                  <div className="flex items-center gap-6 lg:flex-col lg:items-end lg:gap-4">
                    <div className="text-right">
                      {room.originalPrice && room.originalPrice > room.price && (
                        <p className="text-sm text-muted-foreground line-through">
                          {currency} {room.originalPrice.toLocaleString()}
                        </p>
                      )}
                      <p className="font-heading text-heading-standard text-primary">
                        {currency} {room.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">per night</p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDecrease(room)}
                        disabled={selectedQty === 0}
                        className="h-10 w-10"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold text-lg">
                        {selectedQty}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleIncrease(room)}
                        disabled={room.available <= selectedQty}
                        className="h-10 w-10"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
