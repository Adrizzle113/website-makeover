import { useState } from "react";
import { ChevronDown, ChevronUp, Coffee, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PaymentTypeBadge, normalizePaymentType } from "./PaymentTypeBadge";
import { cn } from "@/lib/utils";

export interface RateOption {
  id: string;
  price: number;
  currency: string;
  meal: string;
  mealLabel: string;
  paymentType: string;
  paymentLabel: string;
  cancellation: string;
  bookHash?: string;
  matchHash?: string;
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

const getCancellationDisplay = (cancellation: string) => {
  const lower = cancellation?.toLowerCase() || "";
  const isFreeCancellation = lower.includes("free") || lower.includes("refundable");
  
  return {
    isFreeCancellation,
    label: isFreeCancellation ? "Free cancellation" : "Non-refundable",
    icon: isFreeCancellation ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />,
    className: isFreeCancellation ? "text-green-600" : "text-muted-foreground",
  };
};

export function RateOptionsList({
  rates,
  selectedRateId,
  onSelectRate,
  nights,
  className,
}: RateOptionsListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (rates.length <= 1) return null;

  const otherRates = rates.filter((r) => r.id !== selectedRateId);
  const selectedRate = rates.find((r) => r.id === selectedRateId);

  return (
    <div className={cn("mt-4 pt-4 border-t border-border", className)}>
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
              const cancellationInfo = getCancellationDisplay(rate.cancellation);
              const pricePerNight = Math.round(rate.price / nights);
              const isSelected = rate.id === selectedRateId;

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
