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
import { Plus, User, ChevronDown, Baby } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useBookingStore } from "@/stores/bookingStore";
import type { HotelDetails, RoomSelection } from "@/types/booking";

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  type: "adult" | "child";
  age?: number;
}

interface GuestInformationSectionProps {
  rooms: RoomSelection[];
  hotel: HotelDetails;
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

export function GuestInformationSection({ rooms, hotel }: GuestInformationSectionProps) {
  const { searchParams, setSearchParams } = useBookingStore();
  const [citizenship, setCitizenship] = useState("United States");
  const [guests, setGuests] = useState<Guest[]>([
    { id: "1", firstName: "", lastName: "", type: "adult" },
  ]);
  const [showSpecialRequests, setShowSpecialRequests] = useState(false);
  const [specialRequests, setSpecialRequests] = useState("");

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
  }, [guests]);

  const handleGuestChange = (
    guestId: string,
    field: "firstName" | "lastName" | "type" | "age",
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
            Guests' Citizenship
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
                    Guest {index + 1}
                  </p>
                </div>
                <Select
                  value={guest.type}
                  onValueChange={(value: "adult" | "child") =>
                    handleGuestChange(guest.id, "type", value)
                  }
                >
                  <SelectTrigger className="w-28 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adult">Adult</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    First Name *
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
                    Last Name *
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
                
                {guest.type === "child" && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Age *
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
              {guests.length > 1 && (
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGuest(guest.id)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    Remove guest
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Guest Button */}
        <div className="mt-6">
          <Button
            variant="ghost"
            onClick={addGuest}
            className="flex items-center gap-2 text-primary hover:text-primary/80"
          >
            <User className="h-4 w-4" />
            <Plus className="h-3 w-3" />
            <span>Add another guest</span>
          </Button>
        </div>

        {/* Special Requests */}
        <div className="mt-8">
          <Button
            variant="ghost"
            onClick={() => setShowSpecialRequests(!showSpecialRequests)}
            className="flex items-center gap-2 text-foreground hover:text-primary p-0"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                showSpecialRequests ? "rotate-180" : ""
              }`}
            />
            <span>Special Requests</span>
          </Button>

          {showSpecialRequests && (
            <div className="mt-4">
              <Textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Enter any special requests (e.g., early check-in, high floor, etc.)"
                className="resize-none h-24"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
