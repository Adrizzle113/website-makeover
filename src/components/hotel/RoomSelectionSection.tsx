import { useState, useMemo } from "react";
import { Plus, Minus, Bed, Check, Users, Maximize, Wifi, Bath, Wind, Tv, Crown, Home, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { HotelDetails, RateHawkRoomGroup, RateHawkRate, ProcessedRate } from "@/types/booking";
import { useBookingStore } from "@/stores/bookingStore";

// Room category types for sorting and badges
type RoomCategory = "standard" | "deluxe" | "suite" | "premium" | "family" | "apartment";

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
  isFallbackPrice?: boolean;
  category: RoomCategory;
}

// Get room category from name
const getRoomCategory = (name: string): RoomCategory => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("presidential") || lowerName.includes("royal") || lowerName.includes("grand") || lowerName.includes("luxury")) {
    return "premium";
  }
  if (lowerName.includes("suite") || lowerName.includes("ambassador")) {
    return "suite";
  }
  if (lowerName.includes("family") || lowerName.includes("apartment") || lowerName.includes("villa")) {
    return "family";
  }
  if (lowerName.includes("deluxe") || lowerName.includes("superior")) {
    return "deluxe";
  }
  if (lowerName.includes("studio") || lowerName.includes("cottage") || lowerName.includes("bungalow")) {
    return "apartment";
  }
  return "standard";
};

// Category sort order (standard first, premium last)
const categorySortOrder: Record<RoomCategory, number> = {
  standard: 0,
  deluxe: 1,
  apartment: 2,
  family: 3,
  suite: 4,
  premium: 5,
};

// Category badge config
const categoryBadgeConfig: Record<RoomCategory, { label: string; variant: "default" | "secondary" | "outline"; icon: React.ReactNode }> = {
  standard: { label: "Standard", variant: "outline", icon: null },
  deluxe: { label: "Deluxe", variant: "secondary", icon: <Star className="w-3 h-3" /> },
  apartment: { label: "Apartment", variant: "outline", icon: <Home className="w-3 h-3" /> },
  family: { label: "Family", variant: "secondary", icon: <Users className="w-3 h-3" /> },
  suite: { label: "Suite", variant: "default", icon: <Crown className="w-3 h-3" /> },
  premium: { label: "Premium", variant: "default", icon: <Crown className="w-3 h-3" /> },
};

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

// Get occupancy from room name
const getOccupancyFromName = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("single")) return "1 guest";
  if (lowerName.includes("triple")) return "3 guests";
  if (lowerName.includes("quadruple") || lowerName.includes("quad")) return "4 guests";
  if (lowerName.includes("studio")) return "1-2 guests";
  if (lowerName.includes("family")) return "4-6 guests";
  return "2 guests";
};

// Category-based price multipliers for fallback pricing
const categoryPriceMultiplier: Record<RoomCategory, number> = {
  standard: 1.0,
  deluxe: 1.15,
  apartment: 1.20,
  family: 1.25,
  suite: 1.40,
  premium: 1.75,
};

// Extract rates from multiple possible locations in ratehawk_data
const extractAllRates = (hotel: HotelDetails): { rates: RateHawkRate[]; processedRates: ProcessedRate[] | null; source: string } => {
  const data = hotel.ratehawk_data;
  if (!data) return { rates: [], processedRates: null, source: 'none' };

  // Check for processed_rates first (has rg_hash mapping)
  const processedRates = data.enhancedData?.processed_rates || null;

  // Try multiple locations for raw rates, prioritizing most complete data
  const possibleRateLocations = [
    { key: 'enhancedData.rates', value: data.enhancedData?.rates },
    { key: 'rates', value: data.rates },
    { key: 'data.data.hotels[0].rates', value: (data as any)?.data?.data?.hotels?.[0]?.rates },
    { key: 'av_resp[0].rates', value: (data as any)?.av_resp?.[0]?.rates },
    { key: 'data.rates', value: (data as any)?.data?.rates },
  ];

  for (const location of possibleRateLocations) {
    if (Array.isArray(location.value) && location.value.length > 0) {
      console.log(`📊 Found ${location.value.length} rates at ${location.key}`);
      return { rates: location.value, processedRates, source: location.key };
    }
  }

  return { rates: [], processedRates, source: 'none' };
};

// Process rooms from RateHawk data structure
const processRooms = (hotel: HotelDetails): ProcessedRoom[] => {
  // Debug: Full ratehawk_data structure inspection
  console.log(`🔍 RoomSelectionSection - Full ratehawk_data inspection:`, {
    hasRatehawkData: !!hotel.ratehawk_data,
    topLevelKeys: Object.keys(hotel.ratehawk_data || {}),
    hasEnhancedData: !!hotel.ratehawk_data?.enhancedData,
    enhancedDataKeys: Object.keys(hotel.ratehawk_data?.enhancedData || {}),
    topLevelRoomGroups: hotel.ratehawk_data?.room_groups?.length || 0,
    topLevelRates: hotel.ratehawk_data?.rates?.length || 0,
    enhancedRoomGroups: hotel.ratehawk_data?.enhancedData?.room_groups?.length || 0,
    enhancedRates: hotel.ratehawk_data?.enhancedData?.rates?.length || 0,
    staticVmRoomGroups: (hotel.ratehawk_data?.static_vm?.room_groups as unknown[])?.length || 0,
  });

  // Use enhancedData first (contains full pricing), fallback to top-level data
  const roomGroups = hotel.ratehawk_data?.enhancedData?.room_groups || 
                     hotel.ratehawk_data?.room_groups || [];
  
  // Extract rates from all possible locations
  const { rates, processedRates, source: rateSource } = extractAllRates(hotel);
  
  console.log(`🔍 Using rate source: ${rateSource}`);
  console.log(`🔍 Processing ${roomGroups.length} room groups with ${rates.length} rate entries, ${processedRates?.length || 0} processed rates`);

  // Debug: Inspect processed_rates structure
  if (processedRates && processedRates.length > 0) {
    console.log(`📊 Processed rates inspection:`, {
      count: processedRates.length,
      hasRgHash: processedRates.some(pr => !!pr.rg_hash),
      allRgHashes: processedRates.map(pr => pr.rg_hash).filter(Boolean),
      sample: processedRates[0],
    });
  } else if (rates.length > 0) {
    console.log(`📊 Raw rate structure:`, {
      hasRgHash: !!rates[0]?.rg_hash,
      hasPaymentOptions: !!rates[0]?.payment_options,
      paymentTypesCount: rates[0]?.payment_options?.payment_types?.length || 0,
      samplePayment: rates[0]?.payment_options?.payment_types?.[0],
    });
  }

  if (roomGroups.length === 0) {
    console.log("⚠️ No room_groups found, falling back to rates processing");
    return processRoomsFromRates(hotel, rates);
  }

  // Calculate base price from first rate for fallback pricing
  let basePrice = 0;
  let baseCurrency = "USD";
  if (rates.length > 0) {
    const rate = rates[0];
    if (rate.payment_options?.payment_types?.length && rate.payment_options.payment_types.length > 0) {
      const paymentType = rate.payment_options.payment_types[0];
      basePrice = parseFloat(paymentType.show_amount || paymentType.amount || "0");
      baseCurrency = paymentType.show_currency_code || paymentType.currency_code || "USD";
    } else {
      basePrice = parseFloat(rate.daily_prices || rate.price || "0");
      baseCurrency = rate.currency || "USD";
    }
  }

  // Determine matching strategy
  const canUseIndexMatching = roomGroups.length === rates.length && rates.length > 1;
  if (canUseIndexMatching) {
    console.log(`✅ Index-based matching available: ${roomGroups.length} room groups = ${rates.length} rates`);
  }

  const processedRooms: ProcessedRoom[] = [];
  let skippedRoomGroups = 0;

  roomGroups.forEach((roomGroup: RateHawkRoomGroup, index: number) => {
    try {
      const nameStruct = roomGroup.name_struct || {};
      const mainName = nameStruct.main_name || `Room Type ${index + 1}`;
      const beddingType = nameStruct.bedding_type || "";
      const rgHash = roomGroup.rg_hash;
      const category = getRoomCategory(mainName);

      // Create full room name
      const fullRoomName = beddingType ? `${mainName} - ${beddingType}` : mainName;

      // Strategy 1: Try matching with processed_rates (has rg_hash)
      let matchingProcessedRate = processedRates?.find(pr => pr.rg_hash === rgHash);
      
      // Strategy 2: Try name-based matching with processed_rates
      if (!matchingProcessedRate && processedRates) {
        matchingProcessedRate = processedRates.find(pr => 
          pr.roomName?.toLowerCase().includes(mainName.toLowerCase()) ||
          mainName.toLowerCase().includes(pr.roomName?.toLowerCase() || '')
        );
      }

      // If we have a matching processed rate, use it directly
      if (matchingProcessedRate) {
        processedRooms.push({
          id: roomGroup.room_group_id?.toString() || `room_${index}`,
          name: fullRoomName,
          type: mainName,
          price: Math.round(matchingProcessedRate.price),
          currency: matchingProcessedRate.currency || "USD",
          bedding: beddingType || "Standard bedding",
          occupancy: getOccupancyFromName(mainName),
          size: "Standard size",
          amenities: hotel.amenities?.slice(0, 3).map(a => a.name) || ["Free WiFi", "Air conditioning"],
          cancellation: matchingProcessedRate.cancellationPolicy || "Free cancellation",
          paymentType: "Pay at hotel",
          availability: Math.floor(Math.random() * 8) + 1,
          rgHash: rgHash,
          isFallbackPrice: false,
          category: category,
        });
        return;
      }

      // Strategy 3: Find matching rates from raw rates array using rg_hash
      let matchingRates = rates.filter((rate: RateHawkRate) => rate.rg_hash === rgHash);
      let isFallbackPrice = false;
      let matchedRate: RateHawkRate | null = null;

      // Strategy 4: Index-based assignment if counts match
      if (matchingRates.length === 0 && canUseIndexMatching) {
        console.log(`📌 Index-based rate assignment for room group ${index}: ${mainName}`);
        matchingRates = [rates[index]];
        isFallbackPrice = false; // Index-based is a valid assignment
      }

      // Strategy 5: If only 1 rate exists, use it with category-based price adjustment
      if (matchingRates.length === 0 && rates.length === 1) {
        console.log(`📌 Applying single rate with category adjustment to room group: ${mainName} (${category})`);
        matchedRate = rates[0];
        isFallbackPrice = true;
      } else if (matchingRates.length > 0) {
        matchedRate = matchingRates[0];
      }

      // Strategy 6: No match but we have rates - use first rate as base with adjustment
      if (!matchedRate && rates.length > 0) {
        console.log(`📌 Using first rate as base for: ${mainName}`);
        matchedRate = rates[0];
        isFallbackPrice = true;
      }

      // If still no rate found, skip
      if (!matchedRate) {
        skippedRoomGroups++;
        return;
      }

      // Extract price from matched rate
      let ratePrice = 0;
      let currency = "USD";

      if (matchedRate.payment_options?.payment_types?.length && matchedRate.payment_options.payment_types.length > 0) {
        const paymentType = matchedRate.payment_options.payment_types[0];
        ratePrice = parseFloat(paymentType.show_amount || paymentType.amount || "0");
        currency = paymentType.show_currency_code || paymentType.currency_code || "USD";
      } else {
        ratePrice = parseFloat(matchedRate.daily_prices || matchedRate.price || "0");
        currency = matchedRate.currency || "USD";
      }

      // Apply category-based price adjustment for fallback pricing
      if (isFallbackPrice && ratePrice > 0) {
        const multiplier = categoryPriceMultiplier[category];
        ratePrice = ratePrice * multiplier;
        console.log(`💰 Adjusted price for ${mainName}: base * ${multiplier} = ${Math.round(ratePrice)}`);
      }

      if (ratePrice <= 0) {
        skippedRoomGroups++;
        return;
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

      // Extract amenities from the matched rate
      let roomAmenities: string[] = [];
      if (matchedRate) {
        roomAmenities = [
          ...(matchedRate.amenities || []),
          ...(matchedRate.room_amenities || []),
          ...(matchedRate.rooms?.[0]?.amenities_data || []),
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
      const roomSize = matchedRate?.rooms?.[0]?.size || "Standard size";

      // Get cancellation policy
      const cancellationPolicy = matchedRate?.cancellation_policy?.type || "Free cancellation";

      // Get payment type
      const paymentType = matchedRate?.payment_options?.payment_types?.[0]?.type || "Pay at hotel";

      processedRooms.push({
        id: roomGroup.room_group_id?.toString() || `room_${index}`,
        name: fullRoomName,
        type: mainName,
        price: Math.round(ratePrice),
        currency: currency,
        bedding: beddingDisplay,
        occupancy: occupancy,
        size: roomSize,
        amenities: roomAmenities,
        cancellation: cancellationPolicy,
        paymentType: paymentType,
        availability: Math.floor(Math.random() * 8) + 1,
        rgHash: rgHash,
        isFallbackPrice: isFallbackPrice,
        category: category,
      });
    } catch (error) {
      console.error(`Error processing room group ${index}:`, error);
    }
  });

  console.log(`✅ Processed ${processedRooms.length} rooms from room_groups (skipped ${skippedRoomGroups} without rates)`);

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
        isFallbackPrice: false,
        category: getRoomCategory(room.name),
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
      isFallbackPrice: true,
      category: "standard" as RoomCategory,
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
    isFallbackPrice: true,
    category: "standard" as RoomCategory,
  }];
};

export function RoomSelectionSection({ hotel, isLoading = false }: RoomSelectionSectionProps) {
  const { selectedRooms, addRoom, updateRoomQuantity } = useBookingStore();
  const [displayedRooms, setDisplayedRooms] = useState(6);

  // Process and sort rooms by category
  const sortedRooms = useMemo(() => {
    const rooms = processRooms(hotel);
    return rooms.sort((a, b) => categorySortOrder[a.category] - categorySortOrder[b.category]);
  }, [hotel]);
  
  const roomsToDisplay = sortedRooms.slice(0, displayedRooms);
  const hasMoreRooms = sortedRooms.length > displayedRooms;

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
    setDisplayedRooms((prev) => Math.min(prev + 6, sortedRooms.length));
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

  if (sortedRooms.length === 0) {
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
            Select from {sortedRooms.length} available room type{sortedRooms.length !== 1 ? "s" : ""}
            {hasMoreRooms && (
              <span className="text-primary font-medium">
                {" "}(Showing {displayedRooms} of {sortedRooms.length})
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
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-heading text-heading-small text-foreground">
                        {room.name}
                      </h3>
                      {room.category !== "standard" && (
                        <Badge variant={categoryBadgeConfig[room.category].variant} className="flex items-center gap-1">
                          {categoryBadgeConfig[room.category].icon}
                          {categoryBadgeConfig[room.category].label}
                        </Badge>
                      )}
                    </div>

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
                        {room.isFallbackPrice && <span className="text-sm font-normal text-muted-foreground">From </span>}
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
              Show More Rooms ({sortedRooms.length - displayedRooms} remaining)
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
