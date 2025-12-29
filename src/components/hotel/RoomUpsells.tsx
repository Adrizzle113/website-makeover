import { useState } from "react";
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
import { useBookingStore, type SelectedUpsell, type Upsell } from "@/stores/bookingStore";

interface RoomUpsellsProps {
  roomId: string;
  roomName: string;
  currency: string;
  checkInTime?: string;
  checkOutTime?: string;
}

// Simulated upsell data - in production, this would come from the API
const getAvailableUpsells = (
  roomId: string,
  currency: string,
  checkInTime?: string,
  checkOutTime?: string
): Upsell[] => {
  const upsells: Upsell[] = [];

  // Early check-in upsell (if hotel has a check-in time)
  if (checkInTime) {
    upsells.push({
      id: `early_checkin_${roomId}`,
      type: "early_checkin",
      name: "Early Check-in",
      description: "Check in earlier and start your stay sooner",
      price: 35,
      currency,
      newTime: "10:00 AM",
    });
  }

  // Late checkout upsell (if hotel has a checkout time)
  if (checkOutTime) {
    upsells.push({
      id: `late_checkout_${roomId}`,
      type: "late_checkout",
      name: "Late Checkout",
      description: "Extend your stay and check out later",
      price: 45,
      currency,
      newTime: "3:00 PM",
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
}: RoomUpsellsProps) {
  const { selectedUpsells, addUpsell, removeUpsell } = useBookingStore();

  const availableUpsells = getAvailableUpsells(
    roomId,
    currency,
    checkInTime,
    checkOutTime
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

  const formatCurrency = (price: number) => {
    return currency === "USD" ? `$${price}` : `${currency} ${price}`;
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
                  +{formatCurrency(upsell.price)}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-[200px] text-xs">
                        {upsell.description}. {upsell.type === "early_checkin" 
                          ? `Standard check-in: ${checkInTime}` 
                          : `Standard checkout: ${checkOutTime}`}
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
