import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Clock, ChevronDown, ChevronUp, Loader2, Sun, Moon } from "lucide-react";
import type { UpsellsState } from "@/types/booking";

interface UpsellsPreferencesProps {
  value: UpsellsState;
  onChange: (upsells: UpsellsState) => void;
  defaultCheckinTime?: string; // From hotel static info (e.g., "15:00" or "15:00:00")
  defaultCheckoutTime?: string; // From hotel static info (e.g., "12:00" or "12:00:00")
  disabled?: boolean;
  onApply?: () => void; // Callback to trigger rate refresh
  isLoading?: boolean;
}

// Format time from 24h to 12h display (e.g., "15:00" -> "3:00 PM")
const formatTimeDisplay = (time: string | undefined): string => {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  if (isNaN(hour)) return time;
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes || "00"} ${ampm}`;
};

export function UpsellsPreferences({
  value,
  onChange,
  defaultCheckinTime,
  defaultCheckoutTime,
  disabled = false,
  onApply,
  isLoading = false,
}: UpsellsPreferencesProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveUpsells = value.earlyCheckin.enabled || value.lateCheckout.enabled || value.multipleEclc;

  const handleEarlyCheckinToggle = (enabled: boolean) => {
    onChange({
      ...value,
      earlyCheckin: { ...value.earlyCheckin, enabled },
    });
  };

  const handleEarlyCheckinTime = (time: string) => {
    onChange({
      ...value,
      earlyCheckin: { ...value.earlyCheckin, time: time || null },
    });
  };

  const handleLateCheckoutToggle = (enabled: boolean) => {
    onChange({
      ...value,
      lateCheckout: { ...value.lateCheckout, enabled },
    });
  };

  const handleLateCheckoutTime = (time: string) => {
    onChange({
      ...value,
      lateCheckout: { ...value.lateCheckout, time: time || null },
    });
  };

  const handleOnlyEclcToggle = (checked: boolean) => {
    onChange({
      ...value,
      onlyEclc: checked,
    });
  };

  const handleMultipleEclcToggle = (checked: boolean) => {
    onChange({
      ...value,
      multipleEclc: checked,
    });
  };

  return (
    <Card className="border-border/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-between w-full p-4 text-left hover:bg-accent/50 transition-colors rounded-t-lg"
            disabled={disabled}
          >
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <span className="font-medium">Check-in/Check-out Preferences</span>
                {hasActiveUpsells && (
                  <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
            </div>
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4 space-y-6">
            {/* Early Check-in */}
            <div className="space-y-3 p-4 rounded-lg bg-accent/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sun className="h-4 w-4 text-amber-500" />
                  <div>
                    <Label htmlFor="early-checkin" className="font-medium">
                      Early Check-in
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Request to check in before standard time
                    </p>
                  </div>
                </div>
                <Switch
                  id="early-checkin"
                  checked={value.earlyCheckin.enabled}
                  onCheckedChange={handleEarlyCheckinToggle}
                  disabled={disabled || isLoading}
                />
              </div>

              {value.earlyCheckin.enabled && (
                <div className="pl-7 space-y-2">
                  <Label htmlFor="early-checkin-time" className="text-sm text-muted-foreground">
                    Preferred time (optional)
                  </Label>
                  <Input
                    id="early-checkin-time"
                    type="time"
                    value={value.earlyCheckin.time || ""}
                    onChange={(e) => handleEarlyCheckinTime(e.target.value)}
                    disabled={disabled || isLoading}
                    className="w-32"
                    placeholder="HH:MM"
                  />
                  {defaultCheckinTime && (
                    <p className="text-xs text-muted-foreground">
                      Standard check-in: {formatTimeDisplay(defaultCheckinTime)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Late Checkout */}
            <div className="space-y-3 p-4 rounded-lg bg-accent/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="h-4 w-4 text-indigo-500" />
                  <div>
                    <Label htmlFor="late-checkout" className="font-medium">
                      Late Checkout
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Request to check out after standard time
                    </p>
                  </div>
                </div>
                <Switch
                  id="late-checkout"
                  checked={value.lateCheckout.enabled}
                  onCheckedChange={handleLateCheckoutToggle}
                  disabled={disabled || isLoading}
                />
              </div>

              {value.lateCheckout.enabled && (
                <div className="pl-7 space-y-2">
                  <Label htmlFor="late-checkout-time" className="text-sm text-muted-foreground">
                    Preferred time (optional)
                  </Label>
                  <Input
                    id="late-checkout-time"
                    type="time"
                    value={value.lateCheckout.time || ""}
                    onChange={(e) => handleLateCheckoutTime(e.target.value)}
                    disabled={disabled || isLoading}
                    className="w-32"
                    placeholder="HH:MM"
                  />
                  {defaultCheckoutTime && (
                    <p className="text-xs text-muted-foreground">
                      Standard checkout: {formatTimeDisplay(defaultCheckoutTime)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Multiple ECLC - Show all available time options */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/30">
              <Checkbox
                id="multiple-eclc"
                checked={value.multipleEclc}
                onCheckedChange={(checked) => handleMultipleEclcToggle(checked === true)}
                disabled={disabled || isLoading}
              />
              <div className="space-y-1">
                <Label htmlFor="multiple-eclc" className="font-medium cursor-pointer">
                  Show all available time options
                </Label>
                <p className="text-sm text-muted-foreground">
                  Request all available early check-in and late checkout time slots
                </p>
              </div>
            </div>

            {/* Only show rates with ECLC filter */}
            <div className="flex items-start gap-3 p-4 rounded-lg border border-border/50">
              <Checkbox
                id="only-eclc"
                checked={value.onlyEclc}
                onCheckedChange={(checked) => handleOnlyEclcToggle(checked === true)}
                disabled={disabled || isLoading || (!value.earlyCheckin.enabled && !value.lateCheckout.enabled && !value.multipleEclc)}
              />
              <div className="space-y-1">
                <Label
                  htmlFor="only-eclc"
                  className={`font-medium cursor-pointer ${
                    !value.earlyCheckin.enabled && !value.lateCheckout.enabled && !value.multipleEclc
                      ? "text-muted-foreground"
                      : ""
                  }`}
                >
                  Only show rates with these options available
                </Label>
                <p className="text-sm text-muted-foreground">
                  Hide rates that don't support early check-in or late checkout
                </p>
              </div>
            </div>

            {/* Apply Button */}
            {onApply && hasActiveUpsells && (
              <Button
                onClick={onApply}
                disabled={disabled || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing Rates...
                  </>
                ) : (
                  "Apply & Refresh Rates"
                )}
              </Button>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
