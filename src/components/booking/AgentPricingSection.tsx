import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Lock, Unlock, Info, DollarSign, Percent, AlertTriangle } from "lucide-react";

export interface PricingSnapshot {
  netPrice: number;
  commission: number;
  commissionType: "percentage" | "fixed";
  clientPrice: number;
  currency: string;
}

interface AgentPricingSectionProps {
  netPrice: number;
  currency: string;
  isLocked: boolean;
  onPricingChange: (pricing: PricingSnapshot) => void;
  onUnlockRequest: () => void;
}

export function AgentPricingSection({
  netPrice,
  currency,
  isLocked,
  onPricingChange,
  onUnlockRequest,
}: AgentPricingSectionProps) {
  const [commissionType, setCommissionType] = useState<"percentage" | "fixed">("percentage");
  const [commissionValue, setCommissionValue] = useState<string>("10");
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  // Calculate commission amount and client price
  const commissionAmount = commissionType === "percentage"
    ? (netPrice * parseFloat(commissionValue || "0")) / 100
    : parseFloat(commissionValue || "0");

  const clientPrice = netPrice + commissionAmount;

  // Minimum margin warning (less than 5%)
  const marginPercentage = (commissionAmount / netPrice) * 100;
  const showMarginWarning = marginPercentage < 5 && marginPercentage > 0;

  // Notify parent of pricing changes
  useEffect(() => {
    onPricingChange({
      netPrice,
      commission: commissionAmount,
      commissionType,
      clientPrice,
      currency,
    });
  }, [netPrice, commissionAmount, commissionType, clientPrice, currency]);

  const handleCommissionChange = (value: string) => {
    // Only allow numbers and decimals
    const sanitized = value.replace(/[^0-9.]/g, "");
    setCommissionValue(sanitized);
  };

  const handleEditAttempt = () => {
    if (isLocked) {
      setShowUnlockModal(true);
    }
  };

  const handleConfirmUnlock = () => {
    setShowUnlockModal(false);
    onUnlockRequest();
  };

  return (
    <>
      <Card className="border-0 shadow-lg border-l-4 border-l-primary">
        <CardContent className="p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-2xl font-bold text-foreground">
                Agent Pricing
              </h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      <strong>NET Price:</strong> The cost from ETG/RateHawk.
                      <br />
                      <strong>Client Price:</strong> What your customer pays (NET + your commission).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {isLocked ? (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                <Lock className="h-4 w-4" />
                <span className="text-sm font-medium">Pricing Locked</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                <Unlock className="h-4 w-4" />
                <span className="text-sm font-medium">Editable</span>
              </div>
            )}
          </div>

          {/* Helper Text */}
          <div className={`mb-6 p-3 rounded-lg ${isLocked ? "bg-amber-50 border border-amber-200" : "bg-blue-50 border border-blue-200"}`}>
            <p className={`text-sm ${isLocked ? "text-amber-700" : "text-blue-700"}`}>
              {isLocked ? (
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Pricing is locked after availability confirmation.
                </span>
              ) : (
                "Set your commission before confirming availability."
              )}
            </p>
          </div>

          <div className="space-y-6">
            {/* ETG Net Price (Read-only) */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                ETG Net Price
              </Label>
              <div className="relative">
                <Input
                  value={`${currency} ${netPrice.toFixed(2)}`}
                  readOnly
                  disabled
                  className="bg-muted/50 font-mono text-lg"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Commission */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                Commission
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1" onClick={handleEditAttempt}>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={commissionValue}
                    onChange={(e) => handleCommissionChange(e.target.value)}
                    disabled={isLocked}
                    className={`pr-10 font-mono text-lg ${isLocked ? "bg-muted/50 cursor-not-allowed" : ""}`}
                    placeholder="0"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isLocked ? (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    ) : commissionType === "percentage" ? (
                      <Percent className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <Select
                  value={commissionType}
                  onValueChange={(v: "percentage" | "fixed") => setCommissionType(v)}
                  disabled={isLocked}
                >
                  <SelectTrigger className={`w-32 ${isLocked ? "bg-muted/50" : ""}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <span className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Percent
                      </span>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <span className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Fixed
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {commissionType === "percentage" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Commission amount: {currency} {commissionAmount.toFixed(2)}
                </p>
              )}
              {showMarginWarning && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Low margin warning: {marginPercentage.toFixed(1)}% commission
                </p>
              )}
            </div>

            {/* Client Price (Auto-calculated) */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                Client Price
              </Label>
              <div className="relative">
                <Input
                  value={`${currency} ${clientPrice.toFixed(2)}`}
                  readOnly
                  disabled
                  className="bg-primary/5 border-primary/20 font-mono text-lg font-bold text-primary"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Lock className="h-4 w-4 text-primary/50" />
                </div>
              </div>
            </div>

            {/* Estimated Earnings */}
            <div className="pt-4 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estimated Commission Earnings</span>
                <span className="text-lg font-bold text-green-600">
                  {currency} {commissionAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unlock Confirmation Modal */}
      <Dialog open={showUnlockModal} onOpenChange={setShowUnlockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Re-check Availability Required
            </DialogTitle>
            <DialogDescription className="pt-2">
              Changing the commission after availability has been confirmed requires re-checking availability with the hotel.
              <br /><br />
              This may result in a different price or room becoming unavailable.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowUnlockModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmUnlock} className="bg-primary hover:bg-primary/90">
              Confirm & Re-check
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
