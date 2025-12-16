import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, addDays } from "date-fns";
import { CalendarIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DestinationAutocomplete } from "./DestinationAutocomplete";
import { GuestSelector } from "./GuestSelector";
import { useBookingStore } from "@/stores/bookingStore";
import { ratehawkApi } from "@/services/ratehawkApi";
import { toast } from "@/hooks/use-toast";

export function SearchBar() {
  const navigate = useNavigate();
  const { setSearchParams, setSearchResults, setLoading, setError } = useBookingStore();

  const [destination, setDestination] = useState("");
  const [destinationId, setDestinationId] = useState<string | undefined>();
  const [checkIn, setCheckIn] = useState<Date>(addDays(new Date(), 1));
  const [checkOut, setCheckOut] = useState<Date>(addDays(new Date(), 3));
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  const handleDestinationChange = (value: string, id?: string) => {
    setDestination(value);
    setDestinationId(id);
  };

  const handleSearch = async () => {
    if (!destination) {
      toast({
        title: "Please enter a destination",
        variant: "destructive",
      });
      return;
    }

    const searchParams = {
      destination,
      destinationId,
      checkIn,
      checkOut,
      guests,
      rooms,
    };

    setSearchParams(searchParams);
    setIsSearching(true);
    setLoading(true);
    setError(null);

    try {
      const response = await ratehawkApi.searchHotels(searchParams);
      setSearchResults(response.hotels);
      
      // Scroll to results
      const resultsSection = document.getElementById("search-results");
      resultsSection?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Search error:", error);
      setError("Failed to search hotels. Please try again.");
      toast({
        title: "Search failed",
        description: "Unable to find hotels. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-card/95 backdrop-blur-sm rounded-2xl shadow-card p-4 md:p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Destination */}
          <div className="flex-1 min-w-0">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Destination
            </label>
            <DestinationAutocomplete
              value={destination}
              onChange={handleDestinationChange}
            />
          </div>

          {/* Check-in Date */}
          <div className="flex-shrink-0">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Check-in
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-12 w-full lg:w-[160px] justify-start text-left font-normal",
                    !checkIn && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkIn ? format(checkIn, "MMM d, yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkIn}
                  onSelect={(date) => date && setCheckIn(date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Check-out Date */}
          <div className="flex-shrink-0">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Check-out
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-12 w-full lg:w-[160px] justify-start text-left font-normal",
                    !checkOut && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkOut ? format(checkOut, "MMM d, yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkOut}
                  onSelect={(date) => date && setCheckOut(date)}
                  disabled={(date) => date <= checkIn}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Guests & Rooms */}
          <div className="flex-shrink-0">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Guests & Rooms
            </label>
            <GuestSelector
              guests={guests}
              rooms={rooms}
              onGuestsChange={setGuests}
              onRoomsChange={setRooms}
            />
          </div>

          {/* Search Button */}
          <div className="flex-shrink-0 flex items-end">
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
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
