import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, User, Baby, X } from "lucide-react";
import { useBookingStore } from "@/stores/bookingStore";
import type { HotelDetails, RoomSelection } from "@/types/booking";

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  type: "adult" | "child";
  age?: number;
  isLead: boolean;
}

interface GuestInformationSectionProps {
  rooms: RoomSelection[];
  hotel: HotelDetails;
  onGuestsChange?: (guests: Guest[]) => void;
}

const countries = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
  { code: "BR", name: "Brazil" },
  { code: "IN", name: "India" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "MX", name: "Mexico" },
];

const childAges = Array.from({ length: 17 }, (_, i) => i + 1);

export function GuestInformationSection({ 
  rooms, 
  hotel,
  onGuestsChange 
}: GuestInformationSectionProps) {
  const { searchParams, setSearchParams } = useBookingStore();
  const [citizenship, setCitizenship] = useState("United States");
  const [guests, setGuests] = useState<Guest[]>([
    { id: "1", firstName: "", lastName: "", email: "", type: "adult", isLead: true },
  ]);

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
    
    onGuestsChange?.(guests);
  }, [guests]);

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

  const addGuest = () => {
    const newGuest: Guest = {
      id: Date.now().toString(),
      firstName: "",
      lastName: "",
      type: "adult",
      isLead: false,
    };
    setGuests((prev) => [...prev, newGuest]);
  };

  const removeGuest = (guestId: string) => {
    if (guests.length > 1) {
      setGuests((prev) => prev.filter((guest) => guest.id !== guestId));
    }
  };

  const totalGuestCount = guests.length;
  const adultCount = guests.filter((g) => g.type === "adult").length;
  const childCount = guests.filter((g) => g.type === "child").length;

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
                <SelectItem key={country.code} value={country.name}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Used as residency for booking
          </p>
        </div>

        {/* Room Summary */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-center">
            <p className="text-foreground font-medium">
              {rooms.map((r) => r.roomName).join(", ")} for {totalGuestCount} guest{totalGuestCount !== 1 ? "s" : ""}
              {childCount > 0 && (
                <span className="text-muted-foreground ml-1">
                  ({adultCount} adult{adultCount !== 1 ? "s" : ""}, {childCount} child{childCount !== 1 ? "ren" : ""})
                </span>
              )}
            </p>
            <span className="text-muted-foreground text-sm">
              {rooms.reduce((sum, r) => sum + r.quantity, 0)} room(s)
            </span>
          </div>
        </div>

        {/* Guest Name Fields */}
        <div className="space-y-6">
          {guests.map((guest, index) => (
            <div key={guest.id} className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {guest.type === "child" ? (
                    <Baby className="h-4 w-4 text-primary" />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                  <p className="text-sm font-medium text-foreground">
                    {guest.isLead ? "Lead Guest" : `Guest ${index + 1}`}
                  </p>
                  {guest.isLead && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Primary Contact
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!guest.isLead && (
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
                  )}
                  {!guest.isLead && guests.length > 1 && (
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
                    First Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={guest.firstName}
                    onChange={(e) =>
                      handleGuestChange(guest.id, "firstName", e.target.value)
                    }
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Last Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={guest.lastName}
                    onChange={(e) =>
                      handleGuestChange(guest.id, "lastName", e.target.value)
                    }
                    placeholder="Enter last name"
                    required
                  />
                </div>

                {guest.isLead && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="email"
                      value={guest.email || ""}
                      onChange={(e) =>
                        handleGuestChange(guest.id, "email", e.target.value)
                      }
                      placeholder="Enter email address"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Booking confirmation will be sent to this email
                    </p>
                  </div>
                )}

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
        </div>

        {/* Add Guest Button */}
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={addGuest}
            className="flex items-center gap-2 text-primary border-primary/30 hover:bg-primary/5"
          >
            <Plus className="h-4 w-4" />
            <span>Add another guest</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export type { Guest };
