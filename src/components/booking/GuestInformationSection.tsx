import { useState, useEffect, useCallback, useMemo } from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Plus, User, Baby, X, ChevronDown, ChevronUp, Users, Check, ChevronsUpDown } from "lucide-react";
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
  { code: "ad", name: "Andorra" },
  { code: "ae", name: "United Arab Emirates" },
  { code: "af", name: "Afghanistan" },
  { code: "ag", name: "Antigua and Barbuda" },
  { code: "ai", name: "Anguilla" },
  { code: "al", name: "Albania" },
  { code: "am", name: "Armenia" },
  { code: "ao", name: "Angola" },
  { code: "aq", name: "Antarctica" },
  { code: "ar", name: "Argentina" },
  { code: "as", name: "American Samoa" },
  { code: "at", name: "Austria" },
  { code: "au", name: "Australia" },
  { code: "aw", name: "Aruba" },
  { code: "ax", name: "Åland Islands" },
  { code: "az", name: "Azerbaijan" },
  { code: "ba", name: "Bosnia and Herzegovina" },
  { code: "bb", name: "Barbados" },
  { code: "bd", name: "Bangladesh" },
  { code: "be", name: "Belgium" },
  { code: "bf", name: "Burkina Faso" },
  { code: "bg", name: "Bulgaria" },
  { code: "bh", name: "Bahrain" },
  { code: "bi", name: "Burundi" },
  { code: "bj", name: "Benin" },
  { code: "bl", name: "Saint Barthélemy" },
  { code: "bm", name: "Bermuda" },
  { code: "bn", name: "Brunei Darussalam" },
  { code: "bo", name: "Bolivia" },
  { code: "bq", name: "Bonaire, Sint Eustatius and Saba" },
  { code: "br", name: "Brazil" },
  { code: "bs", name: "Bahamas" },
  { code: "bt", name: "Bhutan" },
  { code: "bv", name: "Bouvet Island" },
  { code: "bw", name: "Botswana" },
  { code: "by", name: "Belarus" },
  { code: "bz", name: "Belize" },
  { code: "ca", name: "Canada" },
  { code: "cc", name: "Cocos (Keeling) Islands" },
  { code: "cd", name: "Democratic Republic of the Congo" },
  { code: "cf", name: "Central African Republic" },
  { code: "cg", name: "Republic of the Congo" },
  { code: "ch", name: "Switzerland" },
  { code: "ci", name: "Côte d'Ivoire" },
  { code: "ck", name: "Cook Islands" },
  { code: "cl", name: "Chile" },
  { code: "cm", name: "Cameroon" },
  { code: "cn", name: "China" },
  { code: "co", name: "Colombia" },
  { code: "cr", name: "Costa Rica" },
  { code: "cu", name: "Cuba" },
  { code: "cv", name: "Cabo Verde" },
  { code: "cw", name: "Curaçao" },
  { code: "cx", name: "Christmas Island" },
  { code: "cy", name: "Cyprus" },
  { code: "cz", name: "Czechia" },
  { code: "de", name: "Germany" },
  { code: "dj", name: "Djibouti" },
  { code: "dk", name: "Denmark" },
  { code: "dm", name: "Dominica" },
  { code: "do", name: "Dominican Republic" },
  { code: "dz", name: "Algeria" },
  { code: "ec", name: "Ecuador" },
  { code: "ee", name: "Estonia" },
  { code: "eg", name: "Egypt" },
  { code: "eh", name: "Western Sahara" },
  { code: "er", name: "Eritrea" },
  { code: "es", name: "Spain" },
  { code: "et", name: "Ethiopia" },
  { code: "fi", name: "Finland" },
  { code: "fj", name: "Fiji" },
  { code: "fk", name: "Falkland Islands (Malvinas)" },
  { code: "fm", name: "Micronesia" },
  { code: "fo", name: "Faroe Islands" },
  { code: "fr", name: "France" },
  { code: "ga", name: "Gabon" },
  { code: "gb", name: "United Kingdom of Great Britain and Northern Ireland" },
  { code: "gd", name: "Grenada" },
  { code: "ge", name: "Georgia" },
  { code: "gf", name: "French Guiana" },
  { code: "gg", name: "Guernsey" },
  { code: "gh", name: "Ghana" },
  { code: "gi", name: "Gibraltar" },
  { code: "gl", name: "Greenland" },
  { code: "gm", name: "Gambia" },
  { code: "gn", name: "Guinea" },
  { code: "gp", name: "Guadeloupe" },
  { code: "gq", name: "Equatorial Guinea" },
  { code: "gr", name: "Greece" },
  { code: "gs", name: "South Georgia and the South Sandwich Islands" },
  { code: "gt", name: "Guatemala" },
  { code: "gu", name: "Guam" },
  { code: "gw", name: "Guinea-Bissau" },
  { code: "gy", name: "Guyana" },
  { code: "hk", name: "Hong Kong" },
  { code: "hm", name: "Heard Island and McDonald Islands" },
  { code: "hn", name: "Honduras" },
  { code: "hr", name: "Croatia" },
  { code: "ht", name: "Haiti" },
  { code: "hu", name: "Hungary" },
  { code: "id", name: "Indonesia" },
  { code: "ie", name: "Ireland" },
  { code: "il", name: "Israel" },
  { code: "im", name: "Isle of Man" },
  { code: "in", name: "India" },
  { code: "io", name: "British Indian Ocean Territory" },
  { code: "iq", name: "Iraq" },
  { code: "ir", name: "Iran" },
  { code: "is", name: "Iceland" },
  { code: "it", name: "Italy" },
  { code: "je", name: "Bailiwick of Jersey" },
  { code: "jm", name: "Jamaica" },
  { code: "jo", name: "Jordan" },
  { code: "jp", name: "Japan" },
  { code: "ke", name: "Kenya" },
  { code: "kg", name: "Kyrgyzstan" },
  { code: "kh", name: "Cambodia" },
  { code: "ki", name: "Kiribati" },
  { code: "km", name: "Comoros" },
  { code: "kn", name: "Saint Kitts and Nevis" },
  { code: "kp", name: "North Korea" },
  { code: "kr", name: "South Korea" },
  { code: "kw", name: "Kuwait" },
  { code: "ky", name: "Cayman Islands" },
  { code: "kz", name: "Kazakhstan" },
  { code: "la", name: "Laos" },
  { code: "lb", name: "Lebanon" },
  { code: "lc", name: "Saint Lucia" },
  { code: "li", name: "Liechtenstein" },
  { code: "lk", name: "Sri Lanka" },
  { code: "lr", name: "Liberia" },
  { code: "ls", name: "Lesotho" },
  { code: "lt", name: "Lithuania" },
  { code: "lu", name: "Luxembourg" },
  { code: "lv", name: "Latvia" },
  { code: "ly", name: "Libya" },
  { code: "ma", name: "Morocco" },
  { code: "mc", name: "Monaco" },
  { code: "md", name: "Moldova" },
  { code: "me", name: "Montenegro" },
  { code: "mf", name: "Saint Martin" },
  { code: "mg", name: "Madagascar" },
  { code: "mh", name: "Marshall Islands" },
  { code: "mk", name: "North Macedonia" },
  { code: "ml", name: "Mali" },
  { code: "mm", name: "Myanmar" },
  { code: "mn", name: "Mongolia" },
  { code: "mo", name: "Macao" },
  { code: "mp", name: "Northern Mariana Islands" },
  { code: "mq", name: "Martinique" },
  { code: "mr", name: "Mauritania" },
  { code: "ms", name: "Montserrat" },
  { code: "mt", name: "Malta" },
  { code: "mu", name: "Mauritius" },
  { code: "mv", name: "Maldives" },
  { code: "mw", name: "Malawi" },
  { code: "mx", name: "Mexico" },
  { code: "my", name: "Malaysia" },
  { code: "mz", name: "Mozambique" },
  { code: "na", name: "Namibia" },
  { code: "nc", name: "New Caledonia" },
  { code: "ne", name: "Niger" },
  { code: "nf", name: "Norfolk Island" },
  { code: "ng", name: "Nigeria" },
  { code: "ni", name: "Nicaragua" },
  { code: "nl", name: "Netherlands" },
  { code: "no", name: "Norway" },
  { code: "np", name: "Nepal" },
  { code: "nr", name: "Nauru" },
  { code: "nu", name: "Niue" },
  { code: "nz", name: "New Zealand" },
  { code: "om", name: "Oman" },
  { code: "pa", name: "Panama" },
  { code: "pe", name: "Peru" },
  { code: "pf", name: "French Polynesia" },
  { code: "pg", name: "Papua New Guinea" },
  { code: "ph", name: "Philippines" },
  { code: "pk", name: "Pakistan" },
  { code: "pl", name: "Poland" },
  { code: "pm", name: "Saint Pierre and Miquelon" },
  { code: "pn", name: "Pitcairn" },
  { code: "pr", name: "Puerto Rico" },
  { code: "ps", name: "Palestine" },
  { code: "pt", name: "Portugal" },
  { code: "pw", name: "Palau" },
  { code: "py", name: "Paraguay" },
  { code: "qa", name: "Qatar" },
  { code: "re", name: "Réunion" },
  { code: "ro", name: "Romania" },
  { code: "rs", name: "Serbia" },
  { code: "ru", name: "Russian Federation" },
  { code: "rw", name: "Rwanda" },
  { code: "sa", name: "Saudi Arabia" },
  { code: "sb", name: "Solomon Islands" },
  { code: "sc", name: "Seychelles" },
  { code: "sd", name: "Sudan" },
  { code: "se", name: "Sweden" },
  { code: "sg", name: "Singapore" },
  { code: "sh", name: "Saint Helena, Ascension and Tristan da Cunha" },
  { code: "si", name: "Slovenia" },
  { code: "sj", name: "Svalbard and Jan Mayen" },
  { code: "sk", name: "Slovakia" },
  { code: "sl", name: "Sierra Leone" },
  { code: "sm", name: "San Marino" },
  { code: "sn", name: "Senegal" },
  { code: "so", name: "Somalia" },
  { code: "sr", name: "Suriname" },
  { code: "ss", name: "South Sudan" },
  { code: "st", name: "Sao Tome and Principe" },
  { code: "sv", name: "El Salvador" },
  { code: "sx", name: "Sint Maarten" },
  { code: "sy", name: "Syrian Arab Republic" },
  { code: "sz", name: "Eswatini" },
  { code: "tc", name: "Turks and Caicos Islands" },
  { code: "td", name: "Chad" },
  { code: "tf", name: "French Southern Territories" },
  { code: "tg", name: "Togo" },
  { code: "th", name: "Thailand" },
  { code: "tj", name: "Tajikistan" },
  { code: "tk", name: "Tokelau" },
  { code: "tl", name: "Timor-Leste" },
  { code: "tm", name: "Turkmenistan" },
  { code: "tn", name: "Tunisia" },
  { code: "to", name: "Tonga" },
  { code: "tr", name: "Turkey" },
  { code: "tt", name: "Trinidad and Tobago" },
  { code: "tv", name: "Tuvalu" },
  { code: "tw", name: "Taiwan" },
  { code: "tz", name: "Tanzania" },
  { code: "ua", name: "Ukraine" },
  { code: "ug", name: "Uganda" },
  { code: "um", name: "United States Minor Outlying Islands" },
  { code: "us", name: "United States of America" },
  { code: "uy", name: "Uruguay" },
  { code: "uz", name: "Uzbekistan" },
  { code: "va", name: "Holy See" },
  { code: "vc", name: "Saint Vincent and the Grenadines" },
  { code: "ve", name: "Venezuela" },
  { code: "vg", name: "Virgin Islands (British)" },
  { code: "vi", name: "Virgin Islands (U.S.)" },
  { code: "vn", name: "Vietnam" },
  { code: "vu", name: "Vanuatu" },
  { code: "wf", name: "Wallis and Futuna" },
  { code: "ws", name: "Samoa" },
  { code: "xk", name: "Kosovo" },
  { code: "ye", name: "Yemen" },
  { code: "yt", name: "Mayotte" },
  { code: "za", name: "South Africa" },
  { code: "zm", name: "Zambia" },
  { code: "zw", name: "Zimbabwe" },
].sort((a, b) => a.name.localeCompare(b.name));

const childAges = Array.from({ length: 17 }, (_, i) => i + 1);

export function GuestInformationSection({ 
  rooms, 
  hotel,
  onGuestsChange 
}: GuestInformationSectionProps) {
  const { searchParams, setSearchParams, setResidency } = useBookingStore();
  const [citizenship, setCitizenship] = useState("us");
  const [citizenshipOpen, setCitizenshipOpen] = useState(false);
  const [expandedRooms, setExpandedRooms] = useState<number[]>([0, 1, 2, 3, 4]); // All expanded by default
  const [sameAsLead, setSameAsLead] = useState<Record<number, boolean>>({});
  
  // Get selected country name for display
  const selectedCountryName = useMemo(() => {
    return countries.find(c => c.code === citizenship)?.name || "Select citizenship";
  }, [citizenship]);
  
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
          <Popover open={citizenshipOpen} onOpenChange={setCitizenshipOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={citizenshipOpen}
                className="w-full justify-between font-normal"
              >
                {selectedCountryName}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search country..." />
                <CommandList className="max-h-[300px]">
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup>
                    {countries.map((country) => (
                      <CommandItem
                        key={country.code}
                        value={country.name}
                        onSelect={() => {
                          setCitizenship(country.code);
                          setCitizenshipOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            citizenship === country.code ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {country.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
