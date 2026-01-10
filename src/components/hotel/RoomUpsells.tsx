import { Clock, Info } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useBookingStore, type Upsell } from "@/stores/bookingStore";
import { formatTimeWithPreference } from "@/hooks/useClockFormat";

// ECLC data structure from API
export interface EclcData {
  available?: boolean;
  time?: string;
  price?: { amount: string; currency: string };
}

interface RoomUpsellsProps {
  roomId: string;
  roomName: string;
  currency: string;
  checkInTime?: string;
  checkOutTime?: string;
  // API data for upsells
  earlyCheckin?: EclcData;
  lateCheckout?: EclcData;
}

// Build upsells from API data
const buildUpsellsFromApi = (
  roomId: string,
  currency: string,
  checkInTime?: string,
  checkOutTime?: string,
  earlyCheckin?: EclcData,
  lateCheckout?: EclcData
): Upsell[] => {
  const upsells: Upsell[] = [];

  // Early check-in from API data
  if (earlyCheckin?.available && earlyCheckin.time) {
    const price = earlyCheckin.price 
      ? parseFloat(earlyCheckin.price.amount) 
      : 0;
    const upsellCurrency = earlyCheckin.price?.currency || currency;
    
    upsells.push({
      id: `early_checkin_${roomId}`,
      type: "early_checkin",
      name: "Early Check-in",
      description: checkInTime 
        ? `Check in at ${formatTimeWithPreference(earlyCheckin.time)} instead of ${formatTimeWithPreference(checkInTime)}`
        : `Check in at ${formatTimeWithPreference(earlyCheckin.time)}`,
      price,
      currency: upsellCurrency,
      newTime: formatTimeWithPreference(earlyCheckin.time),
    });
  }

  // Late checkout from API data
  if (lateCheckout?.available && lateCheckout.time) {
    const price = lateCheckout.price 
      ? parseFloat(lateCheckout.price.amount) 
      : 0;
    const upsellCurrency = lateCheckout.price?.currency || currency;
    
    upsells.push({
      id: `late_checkout_${roomId}`,
      type: "late_checkout",
      name: "Late Checkout",
      description: checkOutTime 
        ? `Check out at ${formatTimeWithPreference(lateCheckout.time)} instead of ${formatTimeWithPreference(checkOutTime)}`
        : `Check out at ${formatTimeWithPreference(lateCheckout.time)}`,
      price,
      currency: upsellCurrency,
      newTime: formatTimeWithPreference(lateCheckout.time),
    });
  }

  return upsells;
};

export function RoomUpsells({
  roomId,
  roomName,
  currency,
  checkInTime,
  checkOutTime,
  earlyCheckin,
  lateCheckout,
}: RoomUpsellsProps) {
  const { selectedUpsells, addUpsell, removeUpsell } = useBookingStore();

  const availableUpsells = buildUpsellsFromApi(
    roomId,
    currency,
    checkInTime,
    checkOutTime,
    earlyCheckin,
    lateCheckout
  );

  if (availableUpsells.length === 0) {
    return null;
  }

  const isUpsellSelected = (upsellId: string) => {
    return selectedUpsells.some(
      (u) => u.id === upsellId && u.roomId === roomId
    );
  };

  const handleToggleUpsell = (upsell: Upsell) => {
    if (isUpsellSelected(upsell.id)) {
      removeUpsell(upsell.id, roomId);
    } else {
      addUpsell({ ...upsell, roomId });
    }
  };

  const formatCurrency = (price: number, curr: string) => {
    if (price === 0) return "Free";
    return curr === "USD" ? `$${price.toFixed(2)}` : `${curr} ${price.toFixed(2)}`;
  };

  return (
    <div className="mt-4 pt-4 border-t border-border/50">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
        Add-ons
      </p>
      <div className="space-y-2">
        {availableUpsells.map((upsell) => {
          const isSelected = isUpsellSelected(upsell.id);
          
          return (
            <div
              key={upsell.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border/50 bg-muted/30 hover:border-border"
              )}
              onClick={() => handleToggleUpsell(upsell)}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  id={upsell.id}
                  checked={isSelected}
                  onCheckedChange={() => handleToggleUpsell(upsell)}
                  className="pointer-events-none"
                />
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label
                      htmlFor={upsell.id}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {upsell.name}
                      {upsell.newTime && (
                        <span className="ml-2 text-primary font-normal">
                          ({upsell.newTime})
                        </span>
                      )}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Subject to availability
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {upsell.price > 0 ? `+${formatCurrency(upsell.price, upsell.currency)}` : "Included"}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-[200px] text-xs">
                        {upsell.description}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
