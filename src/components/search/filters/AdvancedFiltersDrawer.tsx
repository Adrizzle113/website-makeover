import { useState } from "react";
import { useBookingStore } from "@/stores/bookingStore";
import { useFilterValues } from "@/hooks/useFilterValues";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  SlidersHorizontal,
  Wifi,
  Coffee,
  Car,
  Waves,
  Dumbbell,
  Wind,
  PawPrint,
  Sparkles,
  Plane,
  Globe,
  Check,
  Building2,
  Home,
  Hotel,
  Castle,
  Tent,
  Clock,
  Sun,
  Moon,
} from "lucide-react";
import type { MealPlan, RoomType, BedType } from "@/types/booking";
import { MEAL_PLAN_LABELS, DEFAULT_UPSELLS_STATE } from "@/types/booking";

// Map RateHawk serp_filter values to icons
const SERP_FILTER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  has_wifi: Wifi,
  has_internet: Globe,
  has_parking: Car,
  has_pool: Waves,
  has_fitness: Dumbbell,
  has_spa: Sparkles,
  has_meal_breakfast: Coffee,
  is_pet_friendly: PawPrint,
  has_airport_transfer: Plane,
  has_conditioner: Wind,
};

// Map hotel kinds to icons
const HOTEL_KIND_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Hotel: Hotel,
  "Apart-hotel": Building2,
  Guesthouse: Home,
  Hostel: Building2,
  Resort: Castle,
  Villa: Home,
  Apartment: Building2,
  Motel: Hotel,
  "B&B": Home,
  Camping: Tent,
};

const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: "standard", label: "Standard Room" },
  { value: "deluxe", label: "Deluxe Room" },
  { value: "suite", label: "Suite" },
  { value: "studio", label: "Studio" },
  { value: "apartment", label: "Apartment" },
];

const BED_TYPES: { value: BedType; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "double", label: "Double" },
  { value: "twin", label: "Twin" },
  { value: "queen", label: "Queen" },
  { value: "king", label: "King" },
];

export function AdvancedFiltersDrawer() {
  const { 
    filters, 
    setFilters, 
    resetFilters, 
    getActiveFilterCount,
    upsellsPreferences,
    setUpsellsPreferences,
    resetUpsellsPreferences,
  } = useBookingStore();
  const { filterValues } = useFilterValues();
  const [isOpen, setIsOpen] = useState(false);
  const activeCount = getActiveFilterCount();

  const handleMealToggle = (meal: MealPlan) => {
    const current = filters.mealPlans;
    const newMeals = current.includes(meal)
      ? current.filter((m) => m !== meal)
      : [...current, meal];
    setFilters({ mealPlans: newMeals });
  };

  const handleAmenityToggle = (amenityId: string) => {
    const current = filters.amenities;
    const newAmenities = current.includes(amenityId)
      ? current.filter((a) => a !== amenityId)
      : [...current, amenityId];
    setFilters({ amenities: newAmenities });
  };

  const handleRoomTypeToggle = (type: RoomType) => {
    const current = filters.roomTypes;
    const newTypes = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    setFilters({ roomTypes: newTypes });
  };

  const handleBedTypeToggle = (type: BedType) => {
    const current = filters.bedTypes;
    const newTypes = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    setFilters({ bedTypes: newTypes });
  };

  const handleHotelKindToggle = (kind: string) => {
    const current = filters.hotelKinds || [];
    const newKinds = current.includes(kind)
      ? current.filter((k) => k !== kind)
      : [...current, kind];
    setFilters({ hotelKinds: newKinds });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          <SlidersHorizontal className="h-4 w-4" />
          <span>More Filters</span>
          {activeCount > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Advanced Filters</SheetTitle>
          <SheetDescription>
            Refine your search with additional criteria
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] pr-4 mt-6">
          <div className="space-y-6">
            {/* Refundable Filter */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Cancellation Policy
              </h3>
              <div className="flex items-center justify-between">
                <Label htmlFor="refundable" className="cursor-pointer">
                  Refundable rates only
                </Label>
                <Switch
                  id="refundable"
                  checked={filters.refundableOnly}
                  onCheckedChange={(checked) => setFilters({ refundableOnly: checked })}
                />
              </div>
            </div>

            <Separator />

            {/* Hotel Types */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Property Type
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {filterValues.hotelKinds.map((kind) => {
                  const Icon = HOTEL_KIND_ICONS[kind.value] || Building2;
                  return (
                    <div
                      key={kind.value}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        (filters.hotelKinds || []).includes(kind.value)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleHotelKindToggle(kind.value)}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{kind.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Meal Plan
              </h3>
              <div className="space-y-2">
                {(Object.keys(MEAL_PLAN_LABELS) as MealPlan[]).map((meal) => (
                  <div key={meal} className="flex items-center space-x-2">
                    <Checkbox
                      id={meal}
                      checked={filters.mealPlans.includes(meal)}
                      onCheckedChange={() => handleMealToggle(meal)}
                    />
                    <Label htmlFor={meal} className="text-sm cursor-pointer">
                      {MEAL_PLAN_LABELS[meal]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Amenities */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Amenities
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {filterValues.serpFilters.map((amenity) => {
                  const Icon = SERP_FILTER_ICONS[amenity.value] || Check;
                  return (
                    <div
                      key={amenity.value}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        filters.amenities.includes(amenity.value)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleAmenityToggle(amenity.value)}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{amenity.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Rate Type */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Rate Type
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="net-rates" className="cursor-pointer">
                    Show NET rates
                  </Label>
                  <Switch
                    id="net-rates"
                    checked={filters.showNetRates}
                    onCheckedChange={(checked) => setFilters({ showNetRates: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="gross-rates" className="cursor-pointer">
                    Show GROSS rates
                  </Label>
                  <Switch
                    id="gross-rates"
                    checked={filters.showGrossRates}
                    onCheckedChange={(checked) => setFilters({ showGrossRates: checked })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Check-in/Check-out Preferences */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Check-in/Check-out
              </h3>
              
              {/* Early Check-in */}
              <div className="space-y-2 p-3 rounded-lg bg-accent/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-amber-500" />
                    <Label htmlFor="early-checkin" className="cursor-pointer">
                      Early Check-in
                    </Label>
                  </div>
                  <Switch
                    id="early-checkin"
                    checked={upsellsPreferences.earlyCheckin.enabled}
                    onCheckedChange={(checked) => 
                      setUpsellsPreferences({
                        ...upsellsPreferences,
                        earlyCheckin: { ...upsellsPreferences.earlyCheckin, enabled: checked }
                      })
                    }
                  />
                </div>
                {upsellsPreferences.earlyCheckin.enabled && (
                  <div className="pl-6">
                    <Label className="text-xs text-muted-foreground">Preferred time</Label>
                    <Input
                      type="time"
                      value={upsellsPreferences.earlyCheckin.time || ""}
                      onChange={(e) =>
                        setUpsellsPreferences({
                          ...upsellsPreferences,
                          earlyCheckin: { ...upsellsPreferences.earlyCheckin, time: e.target.value || null }
                        })
                      }
                      className="w-28 h-8 mt-1"
                    />
                    {!upsellsPreferences.earlyCheckin.time && (
                      <p className="text-xs text-amber-600 mt-1">Select time to enable</p>
                    )}
                  </div>
                )}
              </div>

              {/* Late Checkout */}
              <div className="space-y-2 p-3 rounded-lg bg-accent/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-indigo-500" />
                    <Label htmlFor="late-checkout" className="cursor-pointer">
                      Late Checkout
                    </Label>
                  </div>
                  <Switch
                    id="late-checkout"
                    checked={upsellsPreferences.lateCheckout.enabled}
                    onCheckedChange={(checked) =>
                      setUpsellsPreferences({
                        ...upsellsPreferences,
                        lateCheckout: { ...upsellsPreferences.lateCheckout, enabled: checked }
                      })
                    }
                  />
                </div>
                {upsellsPreferences.lateCheckout.enabled && (
                  <div className="pl-6">
                    <Label className="text-xs text-muted-foreground">Preferred time</Label>
                    <Input
                      type="time"
                      value={upsellsPreferences.lateCheckout.time || ""}
                      onChange={(e) =>
                        setUpsellsPreferences({
                          ...upsellsPreferences,
                          lateCheckout: { ...upsellsPreferences.lateCheckout, time: e.target.value || null }
                        })
                      }
                      className="w-28 h-8 mt-1"
                    />
                    {!upsellsPreferences.lateCheckout.time && (
                      <p className="text-xs text-amber-600 mt-1">Select time to enable</p>
                    )}
                  </div>
                )}
              </div>

              {/* Multiple ECLC - Show all available time options */}
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="multiple-eclc-filter"
                  checked={upsellsPreferences.multipleEclc}
                  onCheckedChange={(checked) =>
                    setUpsellsPreferences({
                      ...upsellsPreferences,
                      multipleEclc: checked === true
                    })
                  }
                />
                <Label htmlFor="multiple-eclc-filter" className="text-sm cursor-pointer">
                  Show all available time options
                </Label>
              </div>

              {/* Only ECLC rates checkbox */}
              {(upsellsPreferences.earlyCheckin.enabled || upsellsPreferences.lateCheckout.enabled || upsellsPreferences.multipleEclc) && (
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="only-eclc"
                    checked={upsellsPreferences.onlyEclc}
                    onCheckedChange={(checked) =>
                      setUpsellsPreferences({
                        ...upsellsPreferences,
                        onlyEclc: checked === true
                      })
                    }
                  />
                  <Label htmlFor="only-eclc" className="text-sm cursor-pointer">
                    Only show rates with these options
                  </Label>
                </div>
              )}
            </div>

            <Separator />

            {/* Room Types */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Room Type
              </h3>
              <div className="flex flex-wrap gap-2">
                {ROOM_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    variant={filters.roomTypes.includes(type.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleRoomTypeToggle(type.value)}
                    className="h-8"
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Bed Types */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Bed Type
              </h3>
              <div className="flex flex-wrap gap-2">
                {BED_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    variant={filters.bedTypes.includes(type.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleBedTypeToggle(type.value)}
                    className="h-8"
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="mt-6 flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => { 
              resetFilters(); 
              resetUpsellsPreferences();
              setIsOpen(false); 
            }} 
            className="flex-1"
          >
            Clear All
          </Button>
          <SheetClose asChild>
            <Button className="flex-1">
              Apply Filters
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}