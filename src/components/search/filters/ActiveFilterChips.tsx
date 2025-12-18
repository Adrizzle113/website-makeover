import { useBookingStore } from "@/stores/bookingStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { 
  MEAL_PLAN_LABELS, 
  PAYMENT_TYPE_LABELS,
  type MealPlan,
  type PaymentType,
} from "@/types/booking";

const STAR_LABELS: Record<number, string> = {
  1: "1 Star",
  2: "2 Stars",
  3: "3 Stars",
  4: "4 Stars",
  5: "5 Stars",
};

const AMENITY_LABELS: Record<string, string> = {
  wifi: "Free Wi-Fi",
  breakfast: "Breakfast",
  parking: "Parking",
  pool: "Pool",
  gym: "Gym",
  ac: "A/C",
  pets: "Pet Friendly",
  spa: "Spa",
  shuttle: "Shuttle",
};

const ROOM_TYPE_LABELS: Record<string, string> = {
  standard: "Standard",
  deluxe: "Deluxe",
  suite: "Suite",
  studio: "Studio",
  apartment: "Apartment",
};

const BED_TYPE_LABELS: Record<string, string> = {
  single: "Single Bed",
  double: "Double Bed",
  twin: "Twin Beds",
  queen: "Queen Bed",
  king: "King Bed",
};

interface FilterChip {
  id: string;
  label: string;
  category: string;
  onRemove: () => void;
}

export function ActiveFilterChips() {
  const { filters, setFilters, resetFilters, getActiveFilterCount } = useBookingStore();
  const activeCount = getActiveFilterCount();

  if (activeCount === 0) return null;

  const chips: FilterChip[] = [];

  // Price range
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    const label = filters.priceMin !== undefined && filters.priceMax !== undefined
      ? `$${filters.priceMin} - $${filters.priceMax}`
      : filters.priceMin !== undefined
        ? `Min $${filters.priceMin}`
        : `Max $${filters.priceMax}`;
    chips.push({
      id: "price",
      label,
      category: "Price",
      onRemove: () => setFilters({ priceMin: undefined, priceMax: undefined }),
    });
  }

  // Star ratings
  filters.starRatings.forEach((star) => {
    chips.push({
      id: `star-${star}`,
      label: STAR_LABELS[star] || `${star} Stars`,
      category: "Stars",
      onRemove: () => setFilters({ 
        starRatings: filters.starRatings.filter((s) => s !== star) 
      }),
    });
  });

  // Free cancellation
  if (filters.freeCancellationOnly) {
    chips.push({
      id: "free-cancel",
      label: "Free Cancellation",
      category: "Policy",
      onRemove: () => setFilters({ freeCancellationOnly: false }),
    });
  }

  // Refundable only
  if (filters.refundableOnly) {
    chips.push({
      id: "refundable",
      label: "Refundable Only",
      category: "Policy",
      onRemove: () => setFilters({ refundableOnly: false }),
    });
  }

  // Meal plans
  filters.mealPlans.forEach((meal) => {
    chips.push({
      id: `meal-${meal}`,
      label: MEAL_PLAN_LABELS[meal as MealPlan] || meal,
      category: "Meal",
      onRemove: () => setFilters({ 
        mealPlans: filters.mealPlans.filter((m) => m !== meal) 
      }),
    });
  });

  // Amenities
  filters.amenities.forEach((amenity) => {
    chips.push({
      id: `amenity-${amenity}`,
      label: AMENITY_LABELS[amenity] || amenity,
      category: "Amenity",
      onRemove: () => setFilters({ 
        amenities: filters.amenities.filter((a) => a !== amenity) 
      }),
    });
  });

  // Payment types
  filters.paymentTypes.forEach((type) => {
    chips.push({
      id: `payment-${type}`,
      label: PAYMENT_TYPE_LABELS[type as PaymentType] || type,
      category: "Payment",
      onRemove: () => setFilters({ 
        paymentTypes: filters.paymentTypes.filter((t) => t !== type) 
      }),
    });
  });

  // Room types
  filters.roomTypes.forEach((type) => {
    chips.push({
      id: `room-${type}`,
      label: ROOM_TYPE_LABELS[type] || type,
      category: "Room",
      onRemove: () => setFilters({ 
        roomTypes: filters.roomTypes.filter((t) => t !== type) 
      }),
    });
  });

  // Bed types
  filters.bedTypes.forEach((type) => {
    chips.push({
      id: `bed-${type}`,
      label: BED_TYPE_LABELS[type] || type,
      category: "Bed",
      onRemove: () => setFilters({ 
        bedTypes: filters.bedTypes.filter((t) => t !== type) 
      }),
    });
  });

  // Residency (only if not default US)
  if (filters.residency && filters.residency !== "US") {
    chips.push({
      id: "residency",
      label: `Residency: ${filters.residency}`,
      category: "Location",
      onRemove: () => setFilters({ residency: "US" }),
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <span className="text-sm text-muted-foreground mr-1">Active filters:</span>
      {chips.map((chip) => (
        <Badge
          key={chip.id}
          variant="secondary"
          className="h-7 gap-1.5 pl-3 pr-1.5 text-sm font-normal bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
        >
          <span className="max-w-[150px] truncate">{chip.label}</span>
          <button
            onClick={chip.onRemove}
            className="ml-1 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
            aria-label={`Remove ${chip.label} filter`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </Badge>
      ))}
      {chips.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}