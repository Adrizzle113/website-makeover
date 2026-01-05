import { useBookingStore } from "@/stores/bookingStore";
import { useFilterValues } from "@/hooks/useFilterValues";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Star,
  DollarSign,
  CreditCard,
  RefreshCcw,
  ChevronDown,
  X,
} from "lucide-react";
import type { PaymentType } from "@/types/booking";
import { PAYMENT_TYPE_LABELS } from "@/types/booking";

interface PrimaryFiltersProps {
  priceRange: { min: number; max: number };
}

export function PrimaryFilters({ priceRange }: PrimaryFiltersProps) {
  const { filters, setFilters, resetFilters, getActiveFilterCount } = useBookingStore();
  const { filterValues } = useFilterValues();
  const activeCount = getActiveFilterCount();

  const handleStarToggle = (star: number) => {
    const current = filters.starRatings;
    const newStars = current.includes(star)
      ? current.filter((s) => s !== star)
      : [...current, star];
    setFilters({ starRatings: newStars });
  };

  const handlePaymentToggle = (type: PaymentType) => {
    const current = filters.paymentTypes;
    const newTypes = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    setFilters({ paymentTypes: newTypes });
  };

  const handlePriceChange = (values: number[]) => {
    setFilters({
      priceMin: values[0] === priceRange.min ? undefined : values[0],
      priceMax: values[1] === priceRange.max ? undefined : values[1],
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Star Rating Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`h-9 gap-1.5 ${filters.starRatings.length > 0 ? "border-primary bg-primary/5" : ""}`}
          >
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Stars</span>
            {filters.starRatings.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {filters.starRatings.length}
              </Badge>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 bg-card" align="start">
          <div className="space-y-3">
            <p className="text-sm font-medium">Star Rating</p>
            <div className="flex flex-wrap gap-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <Button
                  key={star}
                  variant={filters.starRatings.includes(star) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStarToggle(star)}
                  className="h-8 gap-1"
                >
                  {star}
                  <Star className="h-3 w-3 fill-current" />
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Price Range Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`h-9 gap-1.5 ${filters.priceMin !== undefined || filters.priceMax !== undefined ? "border-primary bg-primary/5" : ""}`}
          >
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Price</span>
            {(filters.priceMin !== undefined || filters.priceMax !== undefined) && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {filters.priceMin ?? priceRange.min}-{filters.priceMax ?? priceRange.max}
              </Badge>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 bg-card" align="start">
          <div className="space-y-4">
            <p className="text-sm font-medium">Price Range (per night)</p>
            <div className="px-2">
              <Slider
                value={[
                  filters.priceMin ?? priceRange.min,
                  filters.priceMax ?? priceRange.max,
                ]}
                min={priceRange.min}
                max={priceRange.max}
                step={10}
                onValueChange={handlePriceChange}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Min</Label>
                <Input
                  type="number"
                  value={filters.priceMin ?? priceRange.min}
                  onChange={(e) =>
                    setFilters({ priceMin: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className="h-8"
                />
              </div>
              <span className="mt-5 text-muted-foreground">–</span>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Max</Label>
                <Input
                  type="number"
                  value={filters.priceMax ?? priceRange.max}
                  onChange={(e) =>
                    setFilters({ priceMax: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className="h-8"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Free Cancellation Toggle */}
      <Button
        variant={filters.freeCancellationOnly ? "default" : "outline"}
        size="sm"
        onClick={() => setFilters({ freeCancellationOnly: !filters.freeCancellationOnly })}
        className="h-9 gap-1.5"
      >
        <RefreshCcw className="h-4 w-4" />
        <span className="hidden sm:inline">Free Cancellation</span>
        <span className="sm:hidden">Free Cancel</span>
      </Button>

      {/* Payment Type Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`h-9 gap-1.5 ${filters.paymentTypes.length > 0 ? "border-primary bg-primary/5" : ""}`}
          >
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payment</span>
            {filters.paymentTypes.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {filters.paymentTypes.length}
              </Badge>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 bg-card" align="start">
          <div className="space-y-3">
            <p className="text-sm font-medium">Payment Type</p>
            <div className="space-y-2">
              {(Object.keys(PAYMENT_TYPE_LABELS) as PaymentType[]).map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={filters.paymentTypes.includes(type)}
                    onCheckedChange={() => handlePaymentToggle(type)}
                  />
                  <Label htmlFor={type} className="text-sm cursor-pointer">
                    {PAYMENT_TYPE_LABELS[type]}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Residency Selector */}
      <Select
        value={filters.residency}
        onValueChange={(value) => setFilters({ residency: value })}
      >
        <SelectTrigger className="h-9 w-[120px]">
          <SelectValue placeholder="Residency" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {filterValues.countries.slice(0, 30).map((country) => (
            <SelectItem key={country.value} value={country.value}>
              {country.value} - {country.desc.length > 15 ? country.desc.substring(0, 15) + "..." : country.desc}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear All Filters */}
      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
          Clear ({activeCount})
        </Button>
      )}
    </div>
  );
}