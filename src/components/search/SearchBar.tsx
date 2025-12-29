import { useState } from "react";
import { format, addDays, addYears, differenceInDays } from "date-fns";
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
import { useBookingStore } from "@/stores/bookingStore";
import { ratehawkApi } from "@/services/ratehawkApi";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface Room {
  adults: number;
  childrenAges: number[];
}

const MAX_STAY_NIGHTS = 30;
const MAX_YEARS_AHEAD = 2;

export function SearchBar() {
  const { setSearchParams, setSearchResults, setLoading, setError, filters, searchParams } = useBookingStore();
  const isMobile = useIsMobile();

  // Initialize state from searchParams if available
  const [destination, setDestination] = useState(searchParams?.destination || "");
  const [destinationId, setDestinationId] = useState<string | undefined>(searchParams?.destinationId);
  const [isDestinationSelected, setIsDestinationSelected] = useState(!!searchParams?.destinationId);
  const [checkIn, setCheckIn] = useState<Date>(searchParams?.checkIn ? new Date(searchParams.checkIn) : addDays(new Date(), 1));
  const [checkOut, setCheckOut] = useState<Date>(searchParams?.checkOut ? new Date(searchParams.checkOut) : addDays(new Date(), 3));
  const [rooms, setRooms] = useState<Room[]>(
    searchParams?.rooms 
      ? Array.from({ length: searchParams.rooms }, (_, i) => ({
          adults: i === 0 ? (searchParams.guests - (searchParams.children || 0)) / searchParams.rooms : 2,
          childrenAges: i === 0 ? (searchParams.childrenAges || []) : []
        }))
      : [{ adults: 2, childrenAges: [] }]
  );
  const [isSearching, setIsSearching] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const totalGuests = rooms.reduce((sum, room) => sum + room.adults + room.childrenAges.length, 0);
  const totalChildren = rooms.reduce((sum, room) => sum + room.childrenAges.length, 0);
  const allChildrenAges = rooms.flatMap(room => room.childrenAges);

  // Calculate night count
  const nightCount = differenceInDays(checkOut, checkIn);

  // Date constraints
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxCheckInDate = addYears(today, MAX_YEARS_AHEAD);
  const maxCheckOutDate = addDays(checkIn, MAX_STAY_NIGHTS);

  // Validation
  const hasValidChildren = hasValidChildrenAges(rooms);
  const hasValidDates = checkIn && checkOut && checkOut > checkIn && nightCount <= MAX_STAY_NIGHTS;
  const hasValidGuestCount = rooms.every(room => room.adults + room.childrenAges.length <= 6);

  const isFormValid = isDestinationSelected && hasValidDates && hasValidChildren && hasValidGuestCount;

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
    setIsDestinationSelected(!!id);
  };

  const getValidationErrors = (): string[] => {
    const errors: string[] = [];
    if (!isDestinationSelected) errors.push("Please select a destination from suggestions");
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

      // Pass filters to initial search for server-side filtering
      const response = await ratehawkApi.searchHotels(searchParamsData, 1, filters);
      setSearchResults(response.hotels, response.hasMore, response.totalResults);
      
      // Store results in localStorage for persistence
      localStorage.setItem("hotelSearchResults", JSON.stringify({
        hotels: response.hotels,
        searchParams: searchParamsData,
        timestamp: new Date().toISOString(),
      }));
      
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
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-4 md:p-6 border border-white/20">
        {/* Warning when destination typed but not selected */}
        {destination && !isDestinationSelected && (
          <Alert variant="destructive" className="mb-4 bg-destructive/10 border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a destination from the dropdown suggestions
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Destination */}
          <div className="flex-1 min-w-0">
            <label className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 block">
              Destination
            </label>
            <DestinationAutocomplete
              value={destination}
              onChange={handleDestinationChange}
            />
          </div>

          {/* Check-in Date */}
          <div className="flex-shrink-0">
            <label className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 block">
              Check-in
            </label>
            <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-12 w-full lg:w-[160px] justify-start text-left font-normal bg-cream/50 border-border/50 hover:bg-cream",
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
          <div className="flex-shrink-0">
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
                    "h-12 w-full lg:w-[160px] justify-start text-left font-normal bg-cream/50 border-border/50 hover:bg-cream",
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
          <div className="flex-shrink-0">
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
          <div className="flex-shrink-0 flex items-end">
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className={cn(
                "h-12 px-8 font-semibold rounded-full",
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
