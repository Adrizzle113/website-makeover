import { useState } from "react";
import { format, addDays } from "date-fns";
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
import { GuestSelector } from "./GuestSelector";
import { useBookingStore } from "@/stores/bookingStore";
import { ratehawkApi } from "@/services/ratehawkApi";
import { toast } from "@/hooks/use-toast";

interface Room {
  adults: number;
  childrenAges: number[];
}

export function SearchBar() {
  const { setSearchParams, setSearchResults, setLoading, setError, filters } = useBookingStore();

  const [destination, setDestination] = useState("");
  const [destinationId, setDestinationId] = useState<string | undefined>();
  const [isDestinationSelected, setIsDestinationSelected] = useState(false);
  const [checkIn, setCheckIn] = useState<Date>(addDays(new Date(), 1));
  const [checkOut, setCheckOut] = useState<Date>(addDays(new Date(), 3));
  const [rooms, setRooms] = useState<Room[]>([{ adults: 2, childrenAges: [] }]);
  const [isSearching, setIsSearching] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);

  const totalGuests = rooms.reduce((sum, room) => sum + room.adults + room.childrenAges.length, 0);
  const totalChildren = rooms.reduce((sum, room) => sum + room.childrenAges.length, 0);
  const allChildrenAges = rooms.flatMap(room => room.childrenAges);

  const handleCheckInSelect = (date: Date | undefined) => {
    if (date) {
      setCheckIn(date);
      if (checkOut <= date) {
        setCheckOut(addDays(date, 2));
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
    console.log("📍 Destination changed:", { value, id, isSelected: !!id });
  };

  const handleSearch = async () => {
    if (!destination || !isDestinationSelected) {
      toast({
        title: "Please select a destination",
        description: "Choose a destination from the dropdown suggestions",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setLoading(true);
    setError(null);

    try {

      const searchParams = {
        destination,
        destinationId,
        checkIn,
        checkOut,
        guests: totalGuests,
        rooms: rooms.length,
        children: totalChildren,
        childrenAges: allChildrenAges,
      };

      setSearchParams(searchParams);

      // Pass filters to initial search for server-side filtering
      const response = await ratehawkApi.searchHotels(searchParams, 1, filters);
      setSearchResults(response.hotels, response.hasMore, response.totalResults);
      
      // Store results in localStorage for persistence
      localStorage.setItem("hotelSearchResults", JSON.stringify({
        hotels: response.hotels,
        searchParams,
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

  return (
    <div className="w-full max-w-5xl mx-auto">
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
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Check-out Date */}
          <div className="flex-shrink-0">
            <label className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 block">
              Check-out
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
                  disabled={(date) => date <= checkIn}
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
            />
          </div>

          {/* Search Button */}
          <div className="flex-shrink-0 flex items-end">
            <Button
              onClick={handleSearch}
              disabled={isSearching || !isDestinationSelected}
              className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-full disabled:opacity-50"
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
