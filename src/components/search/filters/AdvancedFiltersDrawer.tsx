import { useState } from "react";
import { useBookingStore } from "@/stores/bookingStore";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Bus,
} from "lucide-react";
import type { MealPlan, RoomType, BedType } from "@/types/booking";
import { MEAL_PLAN_LABELS, AMENITY_OPTIONS } from "@/types/booking";

const AMENITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  breakfast: Coffee,
  parking: Car,
  pool: Waves,
  gym: Dumbbell,
  ac: Wind,
  pets: PawPrint,
  spa: Sparkles,
  shuttle: Bus,
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
  const { filters, setFilters, resetFilters, getActiveFilterCount } = useBookingStore();
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

            {/* Meal Plans */}
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
                {AMENITY_OPTIONS.map((amenity) => {
                  const Icon = AMENITY_ICONS[amenity.id];
                  return (
                    <div
                      key={amenity.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        filters.amenities.includes(amenity.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleAmenityToggle(amenity.id)}
                    >
                      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm">{amenity.label}</span>
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
          <Button variant="outline" onClick={() => { resetFilters(); setIsOpen(false); }} className="flex-1">
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