import { useBookingStore } from "@/stores/bookingStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import type { SortOption } from "@/types/booking";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "popularity", label: "Popularity" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Guest Rating" },
  { value: "distance", label: "Distance from Center" },
  { value: "free-cancellation", label: "Free Cancellation First" },
  { value: "cheapest-rate", label: "Cheapest Rate Only" },
];

interface SortingDropdownProps {
  className?: string;
}

export function SortingDropdown({ className }: SortingDropdownProps) {
  const { sortBy, setSortBy } = useBookingStore();

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    // URL will be updated automatically by useURLSync hook in parent
  };

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <ArrowUpDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
      <span className="text-sm text-muted-foreground hidden sm:block">Sort:</span>
      <Select
        value={sortBy}
        onValueChange={handleSortChange}
      >
        <SelectTrigger className="w-full sm:w-[180px] bg-background text-sm h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
