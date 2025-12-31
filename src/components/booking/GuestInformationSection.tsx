import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Plus, User, Baby, X, ChevronDown, ChevronUp, Users } from "lucide-react";
import { useBookingStore } from "@/stores/bookingStore";
import type { HotelDetails, RoomSelection } from "@/types/booking";
import { cn } from "@/lib/utils";

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  type: "adult" | "child";
  age?: number;
  isLead: boolean;
  roomIndex?: number;
  citizenship?: string;
}

interface GuestInformationSectionProps {
  rooms: RoomSelection[];
  hotel: HotelDetails;
  onGuestsChange?: (guests: Guest[]) => void;
}

const countries = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
];

const childAges = Array.from({ length: 17 }, (_, i) => i + 1);

export function GuestInformationSection({ 
  rooms, 
  hotel,
  onGuestsChange 
}: GuestInformationSectionProps) {
  const { searchParams, setSearchParams, setResidency } = useBookingStore();
  const [citizenship, setCitizenship] = useState("US");
  const [expandedRooms, setExpandedRooms] = useState<number[]>([0, 1, 2, 3, 4]); // All expanded by default
  const [sameAsLead, setSameAsLead] = useState<Record<number, boolean>>({});
  
  // Initialize guests based on rooms
  const initializeGuests = useCallback(() => {
    const initialGuests: Guest[] = [];
    let guestIndex = 0;
    
    rooms.forEach((room, roomIndex) => {
      for (let i = 0; i < room.quantity; i++) {
        // Add 2 adults per room as default
        for (let adultNum = 0; adultNum < 2; adultNum++) {
          initialGuests.push({
            id: `room-${roomIndex}-guest-${guestIndex}`,
            firstName: "",
            lastName: "",
            email: guestIndex === 0 ? "" : undefined, // Only lead guest has email
            type: "adult",
            isLead: guestIndex === 0,
            roomIndex,
          });
          guestIndex++;
        }
      }
    });
    
    return initialGuests.length > 0 ? initialGuests : [
      { id: "1", firstName: "", lastName: "", email: "", type: "adult" as const, isLead: true, roomIndex: 0 },
    ];
  }, [rooms]);

  const [guests, setGuests] = useState<Guest[]>(initializeGuests);

  // Sync citizenship with store
  useEffect(() => {
    setResidency(citizenship);
  }, [citizenship, setResidency]);

  // Sync guest count with booking store
  useEffect(() => {
    if (searchParams) {
      const totalGuests = guests.length;
      const children = guests.filter((g) => g.type === "child");
      const childrenAges = children
        .map((c) => c.age)
        .filter((age): age is number => age !== undefined);

      setSearchParams({
        ...searchParams,
        guests: totalGuests,
        children: children.length,
        childrenAges,
      });
    }
    
    // Add citizenship to guests
    const guestsWithCitizenship = guests.map(g => ({
      ...g,
      citizenship: g.isLead ? citizenship : undefined,
    }));
    
    onGuestsChange?.(guestsWithCitizenship);
  }, [guests, citizenship]);

  const handleGuestChange = (
    guestId: string,
    field: "firstName" | "lastName" | "email" | "type" | "age",
    value: string | number
  ) => {
    setGuests((prev) =>
      prev.map((guest) =>
        guest.id === guestId ? { ...guest, [field]: value } : guest
      )
    );
  };

  const addGuest = (roomIndex: number) => {
    const newGuest: Guest = {
      id: Date.now().toString(),
      firstName: "",
      lastName: "",
      type: "adult",
      isLead: false,
      roomIndex,
    };
    setGuests((prev) => [...prev, newGuest]);
  };

  const removeGuest = (guestId: string) => {
    setGuests((prev) => prev.filter((guest) => guest.id !== guestId));
  };

  const toggleRoomExpanded = (roomIndex: number) => {
    setExpandedRooms(prev => 
      prev.includes(roomIndex) 
        ? prev.filter(i => i !== roomIndex)
        : [...prev, roomIndex]
    );
  };

  const handleSameAsLead = (roomIndex: number, checked: boolean) => {
    setSameAsLead(prev => ({ ...prev, [roomIndex]: checked }));
    
    if (checked) {
      const leadGuest = guests.find(g => g.isLead);
      if (leadGuest) {
        // Copy lead guest info to first guest of this room
        setGuests(prev => prev.map((guest, idx) => {
          const roomGuests = prev.filter(g => g.roomIndex === roomIndex);
          const firstRoomGuest = roomGuests[0];
          if (guest.id === firstRoomGuest?.id && !guest.isLead) {
            return {
              ...guest,
              firstName: leadGuest.firstName,
              lastName: leadGuest.lastName,
            };
          }
          return guest;
        }));
      }
    } else {
      // Clear first guest of this room
      setGuests(prev => prev.map(guest => {
        const roomGuests = prev.filter(g => g.roomIndex === roomIndex);
        const firstRoomGuest = roomGuests[0];
        if (guest.id === firstRoomGuest?.id && !guest.isLead) {
          return { ...guest, firstName: "", lastName: "" };
        }
        return guest;
      }));
    }
  };

  // Group guests by room
  const guestsByRoom: Record<number, Guest[]> = {};
  guests.forEach(guest => {
    const roomIdx = guest.roomIndex ?? 0;
    if (!guestsByRoom[roomIdx]) {
      guestsByRoom[roomIdx] = [];
    }
    guestsByRoom[roomIdx].push(guest);
  });

  const totalGuestCount = guests.length;
  const adultCount = guests.filter((g) => g.type === "adult").length;
  const childCount = guests.filter((g) => g.type === "child").length;
  const leadGuest = guests.find(g => g.isLead);

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6 lg:p-8">
        <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
          Guest Information
        </h2>

        {/* Citizenship */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Guests' Citizenship <span className="text-destructive">*</span>
          </label>
          <Select value={citizenship} onValueChange={setCitizenship}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select citizenship" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <span className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Used as residency for booking rates
          </p>
        </div>

        {/* Room Summary */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <p className="text-foreground font-medium">
                {totalGuestCount} guest{totalGuestCount !== 1 ? "s" : ""}
                <span className="text-muted-foreground ml-1">
                  ({adultCount} adult{adultCount !== 1 ? "s" : ""}{childCount > 0 && `, ${childCount} child${childCount !== 1 ? "ren" : ""}`})
                </span>
              </p>
            </div>
            <span className="text-muted-foreground text-sm">
              {rooms.reduce((sum, r) => sum + r.quantity, 0)} room(s)
            </span>
          </div>
        </div>

        {/* Lead Guest Section */}
        {leadGuest && (
          <div className="mb-6">
            <div className="p-4 border-2 border-primary/30 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">Lead Guest</p>
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  Primary Contact
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    First Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={leadGuest.firstName}
                    onChange={(e) => handleGuestChange(leadGuest.id, "firstName", e.target.value)}
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Last Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={leadGuest.lastName}
                    onChange={(e) => handleGuestChange(leadGuest.id, "lastName", e.target.value)}
                    placeholder="Enter last name"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    value={leadGuest.email || ""}
                    onChange={(e) => handleGuestChange(leadGuest.id, "email", e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Booking confirmation will be sent to this email
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Per-Room Guest Sections */}
        {rooms.length > 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                Additional Guests
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Additional guest details are optional. Only the lead guest is required for the reservation.
              </p>
            </div>
            
            {rooms.map((room, roomIndex) => {
              const roomGuests = guestsByRoom[roomIndex]?.filter(g => !g.isLead) || [];
              const isExpanded = expandedRooms.includes(roomIndex);
              
              return (
                <Collapsible
                  key={room.roomId}
                  open={isExpanded}
                  onOpenChange={() => toggleRoomExpanded(roomIndex)}
                >
                  <div className="border border-border rounded-lg overflow-hidden">
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-foreground">
                            Room {roomIndex + 1}: {room.roomName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {roomGuests.length} guest{roomGuests.length !== 1 ? "s" : ""} assigned
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="p-4 space-y-4">
                        {/* Same as lead checkbox for rooms after first */}
                        {roomIndex > 0 && roomGuests.length > 0 && (
                          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                            <Checkbox
                              id={`same-as-lead-${roomIndex}`}
                              checked={sameAsLead[roomIndex] || false}
                              onCheckedChange={(checked) => handleSameAsLead(roomIndex, checked as boolean)}
                            />
                            <Label htmlFor={`same-as-lead-${roomIndex}`} className="text-sm cursor-pointer">
                              First guest same as lead guest
                            </Label>
                          </div>
                        )}

                        {/* Room Guests */}
                        {roomGuests.map((guest, guestIdx) => (
                          <div key={guest.id} className="p-4 border border-border rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                {guest.type === "child" ? (
                                  <Baby className="h-4 w-4 text-primary" />
                                ) : (
                                  <User className="h-4 w-4 text-primary" />
                                )}
                                <p className="text-sm font-medium text-foreground">
                                  Additional Guest {guestIdx + 1}
                                </p>
                                {guest.type === "child" && guest.age && (
                                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                    Child (age {guest.age})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Select
                                  value={guest.type}
                                  onValueChange={(value: "adult" | "child") =>
                                    handleGuestChange(guest.id, "type", value)
                                  }
                                >
                                  <SelectTrigger className="w-24 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="adult">Adult</SelectItem>
                                    <SelectItem value="child">Child</SelectItem>
                                  </SelectContent>
                                </Select>
                                {roomGuests.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeGuest(guest.id)}
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                  First Name
                                </label>
                                <Input
                                  value={guest.firstName}
                                  onChange={(e) => handleGuestChange(guest.id, "firstName", e.target.value)}
                                  placeholder="Enter first name (optional)"
                                  disabled={sameAsLead[roomIndex] && guestIdx === 0}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                  Last Name
                                </label>
                                <Input
                                  value={guest.lastName}
                                  onChange={(e) => handleGuestChange(guest.id, "lastName", e.target.value)}
                                  placeholder="Enter last name (optional)"
                                  disabled={sameAsLead[roomIndex] && guestIdx === 0}
                                />
                              </div>

                              {guest.type === "child" && (
                                <div>
                                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Age <span className="text-destructive">*</span>
                                  </label>
                                  <Select
                                    value={guest.age?.toString() || ""}
                                    onValueChange={(value) =>
                                      handleGuestChange(guest.id, "age", parseInt(value))
                                    }
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select age" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {childAges.map((age) => (
                                        <SelectItem key={age} value={age.toString()}>
                                          {age} year{age !== 1 ? "s" : ""} old
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Add Guest Button */}
                        <Button
                          variant="outline"
                          onClick={() => addGuest(roomIndex)}
                          className="w-full flex items-center justify-center gap-2 text-primary border-primary/30 hover:bg-primary/5"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add guest to Room {roomIndex + 1}</span>
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
