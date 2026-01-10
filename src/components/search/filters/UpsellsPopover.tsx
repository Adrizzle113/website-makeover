import { useBookingStore } from "@/stores/bookingStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Clock, ChevronDown, Sun, Moon } from "lucide-react";

export function UpsellsPopover() {
  const { upsellsPreferences, setUpsellsPreferences } = useBookingStore();

  const activeCount = [
    upsellsPreferences.earlyCheckin.enabled && upsellsPreferences.earlyCheckin.time,
    upsellsPreferences.lateCheckout.enabled && upsellsPreferences.lateCheckout.time,
    upsellsPreferences.multipleEclc,
  ].filter(Boolean).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-9 gap-1.5 ${activeCount > 0 ? "border-primary bg-primary/5" : ""}`}
        >
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">Check-in/out</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {activeCount}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-card" align="start">
        <div className="space-y-4">
          <p className="text-sm font-medium">Check-in/Check-out Preferences</p>

          {/* Early Check-in */}
          <div className="space-y-2 p-3 rounded-lg bg-accent/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-amber-500" />
                <Label htmlFor="early-checkin-pop" className="text-sm font-medium">
                  Early Check-in
                </Label>
              </div>
              <Switch
                id="early-checkin-pop"
                checked={upsellsPreferences.earlyCheckin.enabled}
                onCheckedChange={(checked) =>
                  setUpsellsPreferences({
                    ...upsellsPreferences,
                    earlyCheckin: { ...upsellsPreferences.earlyCheckin, enabled: checked },
                  })
                }
              />
            </div>
            {upsellsPreferences.earlyCheckin.enabled && (
              <div className="pl-6 space-y-1">
                <Label className="text-xs text-muted-foreground">Preferred time</Label>
                <Input
                  type="time"
                  value={upsellsPreferences.earlyCheckin.time || ""}
                  onChange={(e) =>
                    setUpsellsPreferences({
                      ...upsellsPreferences,
                      earlyCheckin: { ...upsellsPreferences.earlyCheckin, time: e.target.value || null },
                    })
                  }
                  className="w-28 h-8"
                />
                {!upsellsPreferences.earlyCheckin.time && (
                  <p className="text-xs text-amber-600">Select time to enable</p>
                )}
              </div>
            )}
          </div>

          {/* Late Checkout */}
          <div className="space-y-2 p-3 rounded-lg bg-accent/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-indigo-500" />
                <Label htmlFor="late-checkout-pop" className="text-sm font-medium">
                  Late Checkout
                </Label>
              </div>
              <Switch
                id="late-checkout-pop"
                checked={upsellsPreferences.lateCheckout.enabled}
                onCheckedChange={(checked) =>
                  setUpsellsPreferences({
                    ...upsellsPreferences,
                    lateCheckout: { ...upsellsPreferences.lateCheckout, enabled: checked },
                  })
                }
              />
            </div>
            {upsellsPreferences.lateCheckout.enabled && (
              <div className="pl-6 space-y-1">
                <Label className="text-xs text-muted-foreground">Preferred time</Label>
                <Input
                  type="time"
                  value={upsellsPreferences.lateCheckout.time || ""}
                  onChange={(e) =>
                    setUpsellsPreferences({
                      ...upsellsPreferences,
                      lateCheckout: { ...upsellsPreferences.lateCheckout, time: e.target.value || null },
                    })
                  }
                  className="w-28 h-8"
                />
                {!upsellsPreferences.lateCheckout.time && (
                  <p className="text-xs text-amber-600">Select time to enable</p>
                )}
              </div>
            )}
          </div>

          {/* Show All Time Options */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/30">
            <Checkbox
              id="multiple-eclc-pop"
              checked={upsellsPreferences.multipleEclc}
              onCheckedChange={(checked) =>
                setUpsellsPreferences({
                  ...upsellsPreferences,
                  multipleEclc: checked === true,
                })
              }
            />
            <div className="space-y-0.5">
              <Label htmlFor="multiple-eclc-pop" className="text-sm font-medium cursor-pointer">
                Show all time options
              </Label>
              <p className="text-xs text-muted-foreground">
                Request all available early/late time slots
              </p>
            </div>
          </div>

          {/* Only ECLC rates */}
          <div className="flex items-start gap-2 p-3 rounded-lg border border-border/50">
            <Checkbox
              id="only-eclc-pop"
              checked={upsellsPreferences.onlyEclc}
              disabled={
                !upsellsPreferences.earlyCheckin.enabled &&
                !upsellsPreferences.lateCheckout.enabled &&
                !upsellsPreferences.multipleEclc
              }
              onCheckedChange={(checked) =>
                setUpsellsPreferences({
                  ...upsellsPreferences,
                  onlyEclc: checked === true,
                })
              }
            />
            <div className="space-y-0.5">
              <Label
                htmlFor="only-eclc-pop"
                className={`text-sm font-medium cursor-pointer ${
                  !upsellsPreferences.earlyCheckin.enabled &&
                  !upsellsPreferences.lateCheckout.enabled &&
                  !upsellsPreferences.multipleEclc
                    ? "text-muted-foreground"
                    : ""
                }`}
              >
                Only show matching rates
              </Label>
              <p className="text-xs text-muted-foreground">
                Hide rates without these options
              </p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
