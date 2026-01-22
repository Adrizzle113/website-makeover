import * as React from "react";
import { useState } from "react";
import { ChevronDown, ChevronUp, Coffee, Check, X, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PaymentTypeBadge, normalizePaymentType } from "./PaymentTypeBadge";
import { cn } from "@/lib/utils";
import type { TaxItem } from "@/types/booking";

export interface RateOption {
  id: string;
  price: number;
  currency: string;
  meal: string;
  mealLabel: string;
  paymentType: string;
  paymentLabel: string;
  cancellation: string;
  cancellationDeadline?: string;
  cancellationTime?: string;
  cancellationTimezone?: string;
  cancellationRawDate?: string;
  roomAmenities?: string[];
  allotment?: number;
  bookHash?: string;
  matchHash?: string;
  roomSize?: string;
  bedGuaranteed?: boolean;
  cancellationFee?: string;
  // CRITICAL: true ONLY if actual free_cancellation_before field exists in API response
  // RateHawk requires this field for deposit payment bookings
  hasFreeCancellationBefore?: boolean;
  // ECLC (Early Check-in / Late Checkout) data from API
  earlyCheckin?: {
    available?: boolean;
    time?: string;
    price?: { amount: string; currency: string };
  };
  lateCheckout?: {
    available?: boolean;
    time?: string;
    price?: { amount: string; currency: string };
  };
  serpFilters?: string[]; // For checking 'has_early_checkin', 'has_late_checkout'
  taxes?: TaxItem[]; // Non-included taxes from payment_options.payment_types[].tax_data
}

interface RateOptionsListProps {
  rates: RateOption[];
  selectedRateId: string;
  onSelectRate: (rateId: string) => void;
  nights: number;
  className?: string;
}

const getMealLabel = (meal: string): string => {
  const labels: Record<string, string> = {
    nomeal: "Room Only",
    breakfast: "Breakfast",
    "half-board": "Half Board",
    "full-board": "Full Board",
    "all-inclusive": "All Inclusive",
  };
  return labels[meal?.toLowerCase()] || meal || "Room Only";
};

const getMealIcon = (meal: string) => {
  if (meal === "nomeal" || !meal) return null;
  return <Coffee className="w-3 h-3" />;
};

const getCancellationDisplay = (
  cancellation: string, 
  deadline?: string, 
  time?: string,
  timezone?: string,
  fee?: string
) => {
  // Check for explicit free cancellation indicator
  const isFreeCancellation = cancellation === "free_cancellation" || 
    cancellation?.toLowerCase().includes("free") || 
    cancellation?.toLowerCase().includes("refundable");
  
  // Build time display with timezone
  const timeDisplay = time && timezone ? ` at ${time} (${timezone})` : "";
  
  // Build label based on cancellation type and deadline
  let label: string;
  if (isFreeCancellation && deadline) {
    label = `Free cancellation until ${deadline}${timeDisplay}`;
  } else if (deadline && fee && fee !== "0") {
    label = `$${fee} fee until ${deadline}${timeDisplay}`;
  } else if (deadline) {
    label = `Free until ${deadline}${timeDisplay}`;
  } else if (isFreeCancellation) {
    label = "Free cancellation";
  } else {
    label = "Non-refundable";
  }
  
  return {
    isFreeCancellation,
    label,
    icon: isFreeCancellation ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />,
    className: isFreeCancellation ? "text-green-600" : "text-muted-foreground",
  };
};

export const RateOptionsList = React.forwardRef<HTMLDivElement, RateOptionsListProps>(
  function RateOptionsList({ rates, selectedRateId, onSelectRate, nights, className }, ref) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (rates.length <= 1) return null;

    const otherRates = rates.filter((r) => r.id !== selectedRateId);
    const selectedRate = rates.find((r) => r.id === selectedRateId);

    return (
      <div ref={ref} className={cn("mt-4 pt-4 border-t border-border", className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-primary hover:text-primary/80 p-0 h-auto font-medium"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Hide rate options
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              View {otherRates.length} more rate option{otherRates.length !== 1 ? "s" : ""}
            </>
          )}
        </Button>

        {isExpanded && (
          <div className="mt-4 space-y-2">
            <RadioGroup value={selectedRateId} onValueChange={onSelectRate}>
              {rates.map((rate) => {
                const mealLabel = getMealLabel(rate.meal);
                const mealIcon = getMealIcon(rate.meal);
                const cancellationInfo = getCancellationDisplay(rate.cancellation, rate.cancellationDeadline, rate.cancellationTime, rate.cancellationTimezone, rate.cancellationFee);
                const pricePerNight = Math.round(rate.price / nights);
                const isSelected = rate.id === selectedRateId;

                // Allotment display
                const allotmentDisplay = rate.allotment 
                  ? rate.allotment >= 9 
                    ? "9+ rooms" 
                    : `${rate.allotment} room${rate.allotment !== 1 ? "s" : ""} left`
                  : null;

                return (
                  <Label
                    key={rate.id}
                    htmlFor={rate.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={rate.id} id={rate.id} />
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {mealIcon && (
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                              {mealIcon}
                              {mealLabel}
                            </span>
                          )}
                          {!mealIcon && (
                            <span className="text-sm font-medium text-foreground">{mealLabel}</span>
                          )}
                          <PaymentTypeBadge paymentType={normalizePaymentType(rate.paymentType)} />
                        </div>
                        <div className={cn("flex items-center gap-1 text-xs", cancellationInfo.className)}>
                          {cancellationInfo.icon}
                          {cancellationInfo.label}
                        </div>
                        {/* ECLC Indicators */}
                        {(rate.earlyCheckin?.available || rate.lateCheckout?.available || 
                          rate.serpFilters?.includes('has_early_checkin') || 
                          rate.serpFilters?.includes('has_late_checkout')) && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {(rate.earlyCheckin?.available || rate.serpFilters?.includes('has_early_checkin')) && (
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                                <Sun className="w-3 h-3" />
                                Early Check-in
                                {rate.earlyCheckin?.time && <span>({rate.earlyCheckin.time})</span>}
                                {rate.earlyCheckin?.price && (
                                  <span className="font-semibold">+{rate.earlyCheckin.price.amount}</span>
                                )}
                              </Badge>
                            )}
                            {(rate.lateCheckout?.available || rate.serpFilters?.includes('has_late_checkout')) && (
                              <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center gap-1">
                                <Moon className="w-3 h-3" />
                                Late Checkout
                                {rate.lateCheckout?.time && <span>({rate.lateCheckout.time})</span>}
                                {rate.lateCheckout?.price && (
                                  <span className="font-semibold">+{rate.lateCheckout.price.amount}</span>
                                )}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Show differentiating details */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {rate.bedGuaranteed === false && (
                            <span className="text-xs text-amber-600 font-medium">
                              Bed type not guaranteed
                            </span>
                          )}
                          {allotmentDisplay && (
                            <span className={cn(
                              "text-xs font-medium",
                              rate.allotment && rate.allotment <= 3 ? "text-orange-600" : "text-muted-foreground"
                            )}>
                              {allotmentDisplay}
                            </span>
                          )}
                          {rate.roomSize && (
                            <span className="text-xs text-muted-foreground">
                              {rate.roomSize}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-foreground">
                        {rate.currency === "USD" ? "$" : rate.currency}
                        {pricePerNight.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">per night</div>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>
        )}
      </div>
    );
  }
);
