import { useState } from "react";
import { Plus, Minus, Bed, Check, Users, Maximize, Wifi, Bath, Wind, Tv } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { HotelDetails, RateHawkRoomGroup, RateHawkRate } from "@/types/booking";
import { useBookingStore } from "@/stores/bookingStore";

// Processed room structure
interface ProcessedRoom {
  id: string;
  name: string;
  type: string;
  price: number;
  currency: string;
  bedding: string;
  occupancy: string;
  size: string;
  amenities: string[];
  cancellation: string;
  paymentType: string;
  availability: number;
  rgHash?: string;
}

interface RoomSelectionSectionProps {
  hotel: HotelDetails;
  isLoading?: boolean;
}

// Get amenity icon based on name
const getAmenityIcon = (amenity: string) => {
  const lowerAmenity = amenity.toLowerCase();
  if (lowerAmenity.includes("wifi") || lowerAmenity.includes("internet")) {
    return <Wifi className="w-3 h-3" />;
  } else if (lowerAmenity.includes("bath") || lowerAmenity.includes("shower")) {
    return <Bath className="w-3 h-3" />;
  } else if (lowerAmenity.includes("air") || lowerAmenity.includes("conditioning")) {
    return <Wind className="w-3 h-3" />;
  } else if (lowerAmenity.includes("tv") || lowerAmenity.includes("television")) {
    return <Tv className="w-3 h-3" />;
  }
  return <Check className="w-3 h-3" />;
};

// Process rooms from RateHawk data structure
const processRooms = (hotel: HotelDetails): ProcessedRoom[] => {
  const roomGroups = hotel.ratehawk_data?.room_groups || [];
  const rates = hotel.ratehawk_data?.rates || [];

  console.log(`🔍 Processing ${roomGroups.length} room groups with ${rates.length} rate entries`);

  if (roomGroups.length === 0) {
    console.log("⚠️ No room_groups found, falling back to rates processing");
    return processRoomsFromRates(hotel, rates);
  }

  const processedRooms: ProcessedRoom[] = [];

  roomGroups.forEach((roomGroup: RateHawkRoomGroup, index: number) => {
    try {
      const nameStruct = roomGroup.name_struct || {};
      const mainName = nameStruct.main_name || `Room Type ${index + 1}`;
      const beddingType = nameStruct.bedding_type || "";
      const rgHash = roomGroup.rg_hash;

      // Create full room name
      const fullRoomName = beddingType ? `${mainName} - ${beddingType}` : mainName;

      // Find matching rates for this room group
      const matchingRates = rates.filter((rate: RateHawkRate) => rate.rg_hash === rgHash);

      // Get the best rate (lowest price)
      let bestRate: RateHawkRate | null = null;
      let lowestPrice = Infinity;
      let currency = "USD";

      matchingRates.forEach((rate: RateHawkRate) => {
        let ratePrice = 0;

        if (rate.payment_options?.payment_types?.length && rate.payment_options.payment_types.length > 0) {
          const paymentType = rate.payment_options.payment_types[0];
          ratePrice = parseFloat(paymentType.show_amount || paymentType.amount || "0");
          currency = paymentType.show_currency_code || paymentType.currency_code || "USD";
        } else {
          ratePrice = parseFloat(rate.daily_prices || rate.price || "0");
          currency = rate.currency || "USD";
        }

        if (ratePrice > 0 && ratePrice < lowestPrice) {
          lowestPrice = ratePrice;
          bestRate = rate;
        }
      });

      // If no matching rates, use hotel's default price
      if (!bestRate) {
        lowestPrice = hotel.priceFrom || 100;
        currency = hotel.currency || "USD";
      }

      // Determine occupancy from room name
      let occupancy = "2 guests";
      const lowerName = mainName.toLowerCase();
      if (lowerName.includes("single")) occupancy = "1 guest";
      else if (lowerName.includes("triple")) occupancy = "3 guests";
      else if (lowerName.includes("quadruple") || lowerName.includes("quad")) occupancy = "4 guests";
      else if (lowerName.includes("studio")) occupancy = "1-2 guests";
      else if (lowerName.includes("family")) occupancy = "4-6 guests";
      else if (lowerName.includes("double")) occupancy = "2 guests";

      // Extract amenities from the best rate
      let roomAmenities: string[] = [];
      if (bestRate) {
        roomAmenities = [
          ...(bestRate.amenities || []),
          ...(bestRate.room_amenities || []),
          ...(bestRate.rooms?.[0]?.amenities_data || []),
        ].slice(0, 4);
      }

      if (roomAmenities.length === 0) {
        roomAmenities = hotel.amenities?.slice(0, 3).map(a => a.name) || ["Free WiFi", "Air conditioning", "Private bathroom"];
      }

      // Determine bedding display
      let beddingDisplay = beddingType || "Standard bedding";
      if (beddingType) {
        beddingDisplay = beddingType.replace(/\b\w/g, (l: string) => l.toUpperCase());
      } else if (lowerName.includes("twin")) {
        beddingDisplay = "Twin beds";
      } else if (lowerName.includes("double")) {
        beddingDisplay = "Double bed";
      } else if (lowerName.includes("single")) {
        beddingDisplay = "Single bed";
      }

      // Get room size
      const roomSize = bestRate?.rooms?.[0]?.size || "Standard size";

      // Get cancellation policy
      const cancellationPolicy = bestRate?.cancellation_policy?.type || "Free cancellation";

      // Get payment type
      const paymentType = bestRate?.payment_options?.payment_types?.[0]?.type || "Pay at hotel";

      processedRooms.push({
        id: roomGroup.room_group_id?.toString() || `room_${index}`,
        name: fullRoomName,
        type: mainName,
        price: Math.round(lowestPrice),
        currency: currency,
        bedding: beddingDisplay,
        occupancy: occupancy,
        size: roomSize,
        amenities: roomAmenities,
        cancellation: cancellationPolicy,
        paymentType: paymentType,
        availability: Math.floor(Math.random() * 8) + 1,
        rgHash: rgHash,
      });
    } catch (error) {
      console.error(`Error processing room group ${index}:`, error);
    }
  });

  console.log(`✅ Processed ${processedRooms.length} rooms from room_groups`);

  if (processedRooms.length === 0) {
    return processRoomsFromRates(hotel, rates);
  }

  return processedRooms;
};

// Fallback: process rooms from rates array
const processRoomsFromRates = (hotel: HotelDetails, rates: RateHawkRate[]): ProcessedRoom[] => {
  if (rates.length === 0) {
    // Use hotel.rooms if available (from mock data or pre-processed)
    if (hotel.rooms && hotel.rooms.length > 0) {
      return hotel.rooms.map((room, idx) => ({
        id: room.id || `room-${idx}`,
        name: room.name,
        type: room.name,
        price: room.price,
        currency: room.currency || hotel.currency || "USD",
        bedding: room.bedType || "Standard bedding",
        occupancy: `${room.maxOccupancy} guests`,
        size: room.squareFootage ? `${room.squareFootage} ft²` : "Standard size",
        amenities: room.amenities || [],
        cancellation: room.cancellationPolicy || "Standard cancellation",
        paymentType: "Pay at hotel",
        availability: room.available || 1,
      }));
    }

    return [{
      id: "default",
      name: "Standard Room",
      type: "Standard",
      price: hotel.priceFrom || 0,
      currency: hotel.currency || "USD",
      bedding: "Standard bedding",
      occupancy: "2 guests",
      size: "Standard size",
      amenities: hotel.amenities?.slice(0, 3).map(a => a.name) || [],
      cancellation: "Standard cancellation",
      paymentType: "Pay at hotel",
      availability: 1,
    }];
  }

  // Process first rate as fallback
  const rate = rates[0];
  let price = 0;
  let currency = "USD";

  if (rate.payment_options?.payment_types?.length && rate.payment_options.payment_types.length > 0) {
    const paymentType = rate.payment_options.payment_types[0];
    price = parseFloat(paymentType.show_amount || paymentType.amount || "0");
    currency = paymentType.show_currency_code || paymentType.currency_code || "USD";
  }

  return [{
    id: "fallback",
    name: "Standard Room",
    type: "Standard",
    price: Math.round(price) || hotel.priceFrom || 0,
    currency: currency,
    bedding: "Standard bedding",
    occupancy: "2 guests",
    size: "Standard size",
    amenities: hotel.amenities?.slice(0, 3).map(a => a.name) || [],
    cancellation: "Standard cancellation",
    paymentType: "Pay at hotel",
    availability: 1,
  }];
};

export function RoomSelectionSection({ hotel, isLoading = false }: RoomSelectionSectionProps) {
  const { selectedRooms, addRoom, updateRoomQuantity } = useBookingStore();
  const [displayedRooms, setDisplayedRooms] = useState(6);

  // Process rooms from ratehawk_data
  const rooms = processRooms(hotel);
  const roomsToDisplay = rooms.slice(0, displayedRooms);
  const hasMoreRooms = rooms.length > displayedRooms;

  const getSelectedQuantity = (roomId: string) => {
    const selected = selectedRooms.find((r) => r.roomId === roomId);
    return selected?.quantity || 0;
  };

  const handleIncrease = (room: ProcessedRoom) => {
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

  const handleDecrease = (room: ProcessedRoom) => {
    const currentQty = getSelectedQuantity(room.id);
    if (currentQty > 0) {
      updateRoomQuantity(room.id, currentQty - 1);
    }
  };

  const handleLoadMore = () => {
    setDisplayedRooms((prev) => Math.min(prev + 6, rooms.length));
  };

  if (isLoading) {
    return (
      <section className="py-8 bg-app-white-smoke">
        <div className="container">
          <h2 className="font-heading text-heading-standard text-foreground mb-6">
            Select Your Rooms
          </h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 md:p-6 animate-pulse">
                <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                  <div className="h-10 w-32 bg-muted rounded" />
                </div>
              </Card>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">Loading room availability...</p>
        </div>
      </section>
    );
  }

  if (rooms.length === 0) {
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
        <div className="mb-6">
          <h2 className="font-heading text-heading-standard text-foreground mb-2">
            Choose Your Room
          </h2>
          <p className="text-muted-foreground">
            Select from {rooms.length} available room type{rooms.length !== 1 ? "s" : ""}
            {hasMoreRooms && (
              <span className="text-primary font-medium">
                {" "}(Showing {displayedRooms} of {rooms.length})
              </span>
            )}
          </p>
        </div>

        <div className="space-y-4">
          {roomsToDisplay.map((room) => {
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
                      {room.size && room.size !== "Standard size" && (
                        <div className="flex items-center gap-1">
                          <Maximize className="h-4 w-4" />
                          <span>{room.size}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4" />
                        <span>{room.bedding}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{room.occupancy}</span>
                      </div>
                    </div>

                    {room.amenities && room.amenities.length > 0 && (
                      <ScrollArea className="w-full whitespace-nowrap mb-3">
                        <div className="flex gap-3 pb-2">
                          {room.amenities.map((amenity, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-xs text-primary shrink-0"
                            >
                              {getAmenityIcon(amenity)}
                              {amenity}
                            </span>
                          ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    )}

                    {room.cancellation && (
                      <p className="text-xs text-green-600 mt-2">
                        {room.cancellation}
                      </p>
                    )}
                  </div>

                  {/* Price & Selection */}
                  <div className="flex items-center gap-6 lg:flex-col lg:items-end lg:gap-4">
                    <div className="text-right">
                      <p className="font-heading text-heading-standard text-primary">
                        {room.currency} {room.price.toLocaleString()}
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
                        disabled={room.availability <= selectedQty}
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

        {hasMoreRooms && (
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={handleLoadMore}>
              Show More Rooms ({rooms.length - displayedRooms} remaining)
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
