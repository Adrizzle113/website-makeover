import { useState } from "react";
import { format, addDays } from "date-fns";
import { CalendarIcon, Search, ChevronDown, ChevronUp, AlertCircle, Clock, Coffee, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { DestinationAutocomplete } from "@/components/search/DestinationAutocomplete";
import { GuestSelector } from "@/components/search/GuestSelector";
import { useBookingStore } from "@/stores/bookingStore";
import { ratehawkApi } from "@/services/ratehawkApi";
import { toast } from "@/hooks/use-toast";
import type { MealPlan } from "@/types/booking";

interface Room {
  adults: number;
  childrenAges: number[];
}

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "IN", name: "India" },
  { code: "CN", name: "China" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
];

const STAR_RATINGS = [
  { value: 0, label: "No stars" },
  { value: 2, label: "2★" },
  { value: 3, label: "3★" },
  { value: 4, label: "4★" },
  { value: 5, label: "5★" },
];

const MEAL_PLANS: { value: MealPlan; label: string; short: string }[] = [
  { value: "room-only", label: "Room Only", short: "RO" },
  { value: "breakfast", label: "Breakfast", short: "BB" },
  { value: "half-board", label: "Half Board", short: "HB" },
  { value: "full-board", label: "Full Board", short: "FB" },
  { value: "all-inclusive", label: "All Inclusive", short: "AI" },
];

export function EnhancedSearchCard() {
  const { setSearchParams, setSearchResults, setLoading, setError, filters, setFilters } = useBookingStore();

  const [destination, setDestination] = useState("");
  const [destinationId, setDestinationId] = useState<string | undefined>();
  const [isDestinationSelected, setIsDestinationSelected] = useState(false);
  const [checkIn, setCheckIn] = useState<Date>(addDays(new Date(), 1));
  const [checkOut, setCheckOut] = useState<Date>(addDays(new Date(), 3));
  const [rooms, setRooms] = useState<Room[]>([{ adults: 2, childrenAges: [] }]);
  const [isSearching, setIsSearching] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Local filter state
  const [citizenship, setCitizenship] = useState(filters.residency || "US");
  const [selectedStars, setSelectedStars] = useState<number[]>(filters.starRatings || []);
  const [selectedMealPlans, setSelectedMealPlans] = useState<MealPlan[]>(filters.mealPlans || []);
  const [earlyCheckIn, setEarlyCheckIn] = useState(filters.earlyCheckIn || false);
  const [lateCheckOut, setLateCheckOut] = useState(filters.lateCheckOut || false);
  const [freeCancellation, setFreeCancellation] = useState(filters.freeCancellationOnly || false);

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
  };

  const toggleStar = (star: number) => {
    setSelectedStars(prev => 
      prev.includes(star) ? prev.filter(s => s !== star) : [...prev, star]
    );
  };

  const toggleMealPlan = (meal: MealPlan) => {
    setSelectedMealPlans(prev =>
      prev.includes(meal) ? prev.filter(m => m !== meal) : [...prev, meal]
    );
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

    try {
      localStorage.removeItem("hotelSearchResults");
    } catch (e) {
      // Ignore localStorage errors
    }

    setIsSearching(true);
    setLoading(true);
    setError(null);

    // Update filters in store
    const updatedFilters = {
      ...filters,
      residency: citizenship,
      starRatings: selectedStars,
      mealPlans: selectedMealPlans,
      earlyCheckIn,
      lateCheckOut,
      freeCancellationOnly: freeCancellation,
    };
    setFilters(updatedFilters);

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

      const response = await ratehawkApi.searchHotels(searchParams, 1, updatedFilters);
      setSearchResults(response.hotels, response.hasMore, response.totalResults);

      localStorage.setItem("hotelSearchResults", JSON.stringify({
        hotels: response.hotels,
        searchParams,
        timestamp: new Date().toISOString(),
      }));
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
    <div className="w-full max-w-4xl">
      <div className="bg-card/95 backdrop-blur-md rounded-2xl shadow-xl p-6 md:p-8 border border-border/50">
        {/* Warning when destination typed but not selected */}
        {destination && !isDestinationSelected && (
          <Alert variant="destructive" className="mb-4 bg-destructive/10 border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a destination from the dropdown suggestions
            </AlertDescription>
          </Alert>
        )}

        {/* Primary Fields */}
        <div className="space-y-4">
          {/* Row 1: Destination */}
          <div>
            <label className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 block">
              Where are you going?
            </label>
            <DestinationAutocomplete
              value={destination}
              onChange={handleDestinationChange}
              placeholder="Search destinations..."
            />
          </div>

          {/* Row 2: Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 block">
                Check-in
              </label>
              <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-12 w-full justify-start text-left font-normal bg-background border-border hover:bg-muted",
                      !checkIn && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {checkIn ? format(checkIn, "MMM d, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkIn}
                    onSelect={handleCheckInSelect}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 block">
                Check-out
              </label>
              <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-12 w-full justify-start text-left font-normal bg-background border-border hover:bg-muted",
                      !checkOut && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {checkOut ? format(checkOut, "MMM d, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkOut}
                    onSelect={handleCheckOutSelect}
                    disabled={(date) => date <= checkIn}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Row 3: Guests */}
          <div>
            <label className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 block">
              Guests & Rooms
            </label>
            <GuestSelector rooms={rooms} onRoomsChange={setRooms} />
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mt-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {showAdvanced ? "Hide" : "Show"} additional options
        </button>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-border space-y-5">
            {/* Citizenship */}
            <div>
              <label className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 block">
                Guest Citizenship
              </label>
              <Select value={citizenship} onValueChange={setCitizenship}>
                <SelectTrigger className="h-10 bg-background">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(country => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Star Rating */}
            <div>
              <label className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1">
                <Star className="h-3 w-3" />
                Star Rating
              </label>
              <div className="flex flex-wrap gap-2">
                {STAR_RATINGS.map(star => (
                  <button
                    key={star.value}
                    type="button"
                    onClick={() => toggleStar(star.value)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-full border transition-all",
                      selectedStars.includes(star.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:border-primary/50"
                    )}
                  >
                    {star.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Meal Plan */}
            <div>
              <label className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1">
                <Coffee className="h-3 w-3" />
                Meal Plan
              </label>
              <div className="flex flex-wrap gap-2">
                {MEAL_PLANS.map(meal => (
                  <button
                    key={meal.value}
                    type="button"
                    onClick={() => toggleMealPlan(meal.value)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-full border transition-all",
                      selectedMealPlans.includes(meal.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:border-primary/50"
                    )}
                  >
                    {meal.short}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center justify-between bg-background rounded-lg px-4 py-3 border border-border">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Early Check-in</span>
                </div>
                <Switch checked={earlyCheckIn} onCheckedChange={setEarlyCheckIn} />
              </div>

              <div className="flex items-center justify-between bg-background rounded-lg px-4 py-3 border border-border">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Late Check-out</span>
                </div>
                <Switch checked={lateCheckOut} onCheckedChange={setLateCheckOut} />
              </div>

              <div className="flex items-center justify-between bg-background rounded-lg px-4 py-3 border border-border">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Free Cancellation</span>
                </div>
                <Switch checked={freeCancellation} onCheckedChange={setFreeCancellation} />
              </div>
            </div>
          </div>
        )}

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          disabled={isSearching || !isDestinationSelected}
          className="w-full h-14 mt-6 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl text-lg disabled:opacity-50"
        >
          {isSearching ? (
            <span className="animate-pulse">Searching hotels...</span>
          ) : (
            <>
              <Search className="mr-2 h-5 w-5" />
              Search Hotels
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
