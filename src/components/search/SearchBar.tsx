import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format, addDays, differenceInDays, parseISO } from "date-fns";
import { CalendarIcon, Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { DestinationAutocomplete } from "./DestinationAutocomplete";
import { GuestSelector, hasValidChildrenAges } from "./GuestSelector";
import { SearchTypeSelector } from "./SearchTypeSelector";
import { POISearchInput } from "./POISearchInput";
import { GeoSearchInput } from "./GeoSearchInput";
import { HotelIdsInput } from "./HotelIdsInput";
import { useBookingStore } from "@/stores/bookingStore";
import { ratehawkApi } from "@/services/ratehawkApi";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SearchType } from "@/types/booking";

interface Room {
  adults: number;
  childrenAges: number[];
}

import { RATEHAWK_CONSTRAINTS } from "@/config/apiConstraints";

const MAX_STAY_NIGHTS = RATEHAWK_CONSTRAINTS.MAX_STAY_NIGHTS;
const MAX_DAYS_AHEAD = RATEHAWK_CONSTRAINTS.MAX_CHECKIN_DAYS_AHEAD;

export function SearchBar() {
  const [urlSearchParams] = useSearchParams();
  const { setSearchParams, setRawSearchResults, setLoading, setError, filters, searchParams, searchType, setSearchType } = useBookingStore();
  const isMobile = useIsMobile();

  // Parse URL params for initial state
  const getInitialState = () => {
    // First check URL params
    const urlDest = urlSearchParams.get("dest");
    const urlDestId = urlSearchParams.get("destId");
    const urlCheckIn = urlSearchParams.get("checkIn");
    const urlCheckOut = urlSearchParams.get("checkOut");
    const urlGuests = urlSearchParams.get("guests");
    const urlRooms = urlSearchParams.get("rooms");
    const urlChildren = urlSearchParams.get("children");
    const urlAges = urlSearchParams.get("ages");

    // If URL has params, use them (destId is optional - can search by name)
    if (urlDest && urlCheckIn && urlCheckOut) {
      const checkIn = parseISO(urlCheckIn);
      const checkOut = parseISO(urlCheckOut);
      const guests = parseInt(urlGuests || "2", 10);
      const rooms = parseInt(urlRooms || "1", 10);
      const children = parseInt(urlChildren || "0", 10);
      const childrenAges = urlAges ? urlAges.split(",").map(Number).filter(n => !isNaN(n)) : [];

      // Build rooms array from parsed data
      const adultsPerRoom = Math.max(1, Math.floor((guests - children) / rooms));
      const roomsArray: Room[] = Array.from({ length: rooms }, (_, i) => ({
        adults: i === 0 ? (guests - children - (adultsPerRoom * (rooms - 1))) : adultsPerRoom,
        childrenAges: i === 0 ? childrenAges : []
      }));

      return {
        destination: urlDest,
        destinationId: urlDestId || undefined,
        isDestinationSelected: true, // URL params are considered valid selections
        checkIn,
        checkOut,
        rooms: roomsArray,
      };
    }

    // Fall back to store params
    if (searchParams) {
      return {
        destination: searchParams.destination || "",
        destinationId: searchParams.destinationId,
        isDestinationSelected: !!searchParams.destinationId,
        checkIn: searchParams.checkIn ? new Date(searchParams.checkIn) : addDays(new Date(), 1),
        checkOut: searchParams.checkOut ? new Date(searchParams.checkOut) : addDays(new Date(), 3),
        rooms: searchParams.rooms 
          ? Array.from({ length: searchParams.rooms }, (_, i) => ({
              adults: i === 0 ? (searchParams.guests - (searchParams.children || 0)) / searchParams.rooms : 2,
              childrenAges: i === 0 ? (searchParams.childrenAges || []) : []
            }))
          : [{ adults: 2, childrenAges: [] }]
      };
    }

    // Default state
    return {
      destination: "",
      destinationId: undefined,
      isDestinationSelected: false,
      checkIn: addDays(new Date(), 1),
      checkOut: addDays(new Date(), 3),
      rooms: [{ adults: 2, childrenAges: [] }]
    };
  };

  const initialState = getInitialState();

  const [destination, setDestination] = useState(initialState.destination);
  const [destinationId, setDestinationId] = useState<string | undefined>(initialState.destinationId);
  const [isDestinationSelected, setIsDestinationSelected] = useState(initialState.isDestinationSelected);
  const [checkIn, setCheckIn] = useState<Date>(initialState.checkIn);
  const [checkOut, setCheckOut] = useState<Date>(initialState.checkOut);
  const [rooms, setRooms] = useState<Room[]>(initialState.rooms);
  const [isSearching, setIsSearching] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  
  // Alternate search type states
  const [poiName, setPOIName] = useState("");
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geoRadius, setGeoRadius] = useState(5000);
  const [hotelIds, setHotelIds] = useState<string[]>([]);

  const totalGuests = rooms.reduce((sum, room) => sum + room.adults + room.childrenAges.length, 0);
  const totalChildren = rooms.reduce((sum, room) => sum + room.childrenAges.length, 0);
  const allChildrenAges = rooms.flatMap(room => room.childrenAges);

  // Calculate night count
  const nightCount = differenceInDays(checkOut, checkIn);

  // Date constraints
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxCheckInDate = addDays(today, MAX_DAYS_AHEAD);
  const maxCheckOutDate = addDays(checkIn, MAX_STAY_NIGHTS);

  // Validation
  const hasValidChildren = hasValidChildrenAges(rooms);
  const hasValidDates = checkIn && checkOut && checkOut > checkIn && nightCount <= MAX_STAY_NIGHTS;
  const hasValidGuestCount = rooms.every(room => room.adults + room.childrenAges.length <= 6);

  // Form validity depends on search type
  const getSearchTypeValid = (): boolean => {
    switch (searchType) {
      case "region":
        return isDestinationSelected;
      case "poi":
        return poiName.trim().length > 0;
      case "geo":
        return geoCoords !== null;
      case "ids":
        return hotelIds.length > 0;
      default:
        return false;
    }
  };

  const isFormValid = getSearchTypeValid() && hasValidDates && hasValidChildren && hasValidGuestCount;

  const handleCheckInSelect = (date: Date | undefined) => {
    if (date) {
      setCheckIn(date);
      // Auto-adjust checkout if it's before or same as new check-in
      if (checkOut <= date) {
        setCheckOut(addDays(date, 1));
      }
      // Also adjust if checkout exceeds max stay
      const newMaxCheckout = addDays(date, MAX_STAY_NIGHTS);
      if (checkOut > newMaxCheckout) {
        setCheckOut(newMaxCheckout);
      }
      setCheckInOpen(false);
      setTimeout(() => setCheckOutOpen(true), 150);
    }
  };

  const handleCheckOutSelect = (date: Date | undefined) => {
    if (date) {
      setCheckOut(date);
      setCheckOutOpen(false);
    }
  };

  const handleDestinationChange = (value: string, id?: string) => {
    setDestination(value);
    setDestinationId(id);
    // Treat destination as selected if id is defined (even empty string for fallback options)
    setIsDestinationSelected(id !== undefined);
  };

  const getValidationErrors = (): string[] => {
    const errors: string[] = [];
    
    switch (searchType) {
      case "region":
        if (!isDestinationSelected) errors.push("Please select a destination from suggestions");
        break;
      case "poi":
        if (!poiName.trim()) errors.push("Please enter a point of interest");
        break;
      case "geo":
        if (!geoCoords) errors.push("Please set coordinates on the map");
        break;
      case "ids":
        if (hotelIds.length === 0) errors.push("Please add at least one hotel ID");
        break;
    }
    
    if (!hasValidDates) errors.push("Please select valid check-in and check-out dates");
    if (!hasValidChildren) errors.push("Please select age for all children");
    if (!hasValidGuestCount) errors.push("Maximum 6 guests per room");
    return errors;
  };

  const handleSearch = async () => {
    setShowValidation(true);

    if (!isFormValid) {
      const errors = getValidationErrors();
      toast({
        title: "Please complete the form",
        description: errors[0],
        variant: "destructive",
      });
      return;
    }

    // Clear stale cached data to prevent using old region IDs
    try {
      localStorage.removeItem("hotelSearchResults");
    } catch (e) {
      // Ignore localStorage errors
    }

    setIsSearching(true);
    setLoading(true);
    setError(null);

    try {
      const guestData = rooms.map(room => ({
        adults: room.adults,
        children: room.childrenAges,
      }));

      let response;

      switch (searchType) {
        case "poi":
          response = await ratehawkApi.searchByPOI({
            poiName,
            checkin: checkIn,
            checkout: checkOut,
            guests: guestData,
            radius: 5000,
          });
          break;
        case "geo":
          if (!geoCoords) throw new Error("Coordinates required");
          response = await ratehawkApi.searchByGeo({
            latitude: geoCoords.lat,
            longitude: geoCoords.lon,
            checkin: checkIn,
            checkout: checkOut,
            guests: guestData,
            radius: geoRadius,
          });
          break;
        case "ids":
          response = await ratehawkApi.searchByIds({
            hotelIds,
            checkin: checkIn,
            checkout: checkOut,
            guests: guestData,
          });
          break;
        case "region":
        default:
          const searchParamsData = {
            destination,
            destinationId,
            checkIn,
            checkOut,
            guests: totalGuests,
            rooms: rooms.length,
            children: totalChildren,
            childrenAges: allChildrenAges,
          };
          setSearchParams(searchParamsData);
          response = await ratehawkApi.searchHotels(searchParamsData, 1, filters);
          break;
      }

      setRawSearchResults(response.hotels, response.totalResults);
      
      // Results kept in memory only - URL params preserve search criteria
      
      setTimeout(() => {
        const resultsSection = document.getElementById("search-results");
        resultsSection?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Search error:", error);
      const message = error instanceof Error ? error.message : "Failed to search hotels. Please try again.";
      setError(message);
      toast({
        title: "Search failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  };

  // Handle Enter key for search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isFormValid) {
      handleSearch();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto" onKeyDown={handleKeyDown}>
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-4 md:p-6 border border-white/20 relative z-40">
        {/* Search Type Selector */}
        <div className="mb-4">
          <SearchTypeSelector value={searchType} onChange={setSearchType} />
        </div>

        {/* Warning when destination typed but not selected (region mode only) */}
        {searchType === "region" && destination && !isDestinationSelected && (
          <Alert variant="destructive" className="mb-4 bg-destructive/10 border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a destination from the dropdown suggestions
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:flex xl:flex-row gap-4 xl:items-end">
          {/* Search Input - changes based on search type */}
          <div className="md:col-span-2 xl:flex-1 xl:min-w-0">
            <label className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 block">
              {searchType === "region" && "Destination"}
              {searchType === "poi" && "Point of Interest"}
              {searchType === "geo" && "Coordinates"}
              {searchType === "ids" && "Hotel IDs"}
            </label>
            
            {searchType === "region" && (
              <DestinationAutocomplete
                value={destination}
                onChange={handleDestinationChange}
              />
            )}
            
            {searchType === "poi" && (
              <POISearchInput
                value={poiName}
                onChange={setPOIName}
                placeholder="e.g., Eiffel Tower, Times Square..."
              />
            )}
            
            {searchType === "geo" && (
              <GeoSearchInput
                latitude={geoCoords?.lat}
                longitude={geoCoords?.lon}
                radius={geoRadius}
                onLatitudeChange={(lat) => setGeoCoords(prev => lat !== undefined ? { lat, lon: prev?.lon ?? 0 } : null)}
                onLongitudeChange={(lon) => setGeoCoords(prev => lon !== undefined ? { lat: prev?.lat ?? 0, lon } : null)}
                onRadiusChange={setGeoRadius}
              />
            )}
            
            {searchType === "ids" && (
              <HotelIdsInput
                value={hotelIds}
                onChange={setHotelIds}
              />
            )}
          </div>

          {/* Check-in Date */}
          <div className="xl:flex-shrink-0">
            <label className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 block">
              Check-in
            </label>
            <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-12 w-full xl:w-[160px] justify-start text-left font-normal bg-cream/50 border-border/50 hover:bg-cream",
                    !checkIn && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {checkIn ? format(checkIn, "MMM d, yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white" align="start">
                <Calendar
                  mode="single"
                  selected={checkIn}
                  onSelect={handleCheckInSelect}
                  disabled={(date) => date < today || date > maxCheckInDate}
                  numberOfMonths={isMobile ? 1 : 2}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Check-out Date with Night Count */}
          <div className="xl:flex-shrink-0">
            <label className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 block">
              Check-out
              {nightCount > 0 && (
                <span className="ml-2 text-muted-foreground font-normal normal-case">
                  ({nightCount} night{nightCount > 1 ? "s" : ""})
                </span>
              )}
            </label>
            <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-12 w-full xl:w-[160px] justify-start text-left font-normal bg-cream/50 border-border/50 hover:bg-cream",
                    !checkOut && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {checkOut ? format(checkOut, "MMM d, yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white" align="start">
                <Calendar
                  mode="single"
                  selected={checkOut}
                  onSelect={handleCheckOutSelect}
                  disabled={(date) => date <= checkIn || date > maxCheckOutDate}
                  numberOfMonths={isMobile ? 1 : 2}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Guests & Rooms */}
          <div className="xl:flex-shrink-0">
            <label className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 block">
              Guests & Rooms
            </label>
            <GuestSelector
              rooms={rooms}
              onRoomsChange={setRooms}
              showValidation={showValidation}
            />
          </div>

          {/* Search Button */}
          <div className="md:col-span-2 xl:col-span-1 xl:flex-shrink-0 flex items-end">
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className={cn(
                "h-12 w-full xl:w-auto px-8 font-semibold rounded-full",
                isFormValid 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {isSearching ? (
                <span className="animate-pulse">Searching...</span>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
