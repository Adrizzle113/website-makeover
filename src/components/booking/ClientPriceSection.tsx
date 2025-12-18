import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ClientPriceSectionProps {
  totalPrice: number;
  currency: string;
}

export function ClientPriceSection({ totalPrice, currency }: ClientPriceSectionProps) {
  const [clientPrice, setClientPrice] = useState(totalPrice.toFixed(2));
  const [commission, setCommission] = useState("10");
  const [commissionType, setCommissionType] = useState<"percentage" | "dollar">("percentage");
  const { toast } = useToast();

  const calculateCommissionAmount = () => {
    const price = parseFloat(clientPrice) || 0;
    const commissionValue = parseFloat(commission) || 0;

    if (commissionType === "percentage") {
      return ((price * commissionValue) / 100).toFixed(2);
    }
    return commissionValue.toFixed(2);
  };

  const handleBookNow = () => {
    toast({
      title: "Booking Confirmed!",
      description: `Your booking has been submitted successfully. Total: ${currency} ${clientPrice}`,
    });
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6 lg:p-8">
        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
          Client Price & Commission
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Enter the client price. This price will be saved in your back office for informational purposes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Price */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Client Price
            </label>
            <div className="relative">
              <Input
                value={clientPrice}
                onChange={(e) => setClientPrice(e.target.value)}
                className="pr-12 text-lg font-semibold"
                placeholder="0.00"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-semibold">
                {currency}
              </span>
            </div>
          </div>

          {/* Commission */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Commission
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  className="pr-20 text-lg"
                  placeholder="0"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">
                    {commissionType === "percentage" ? "%" : currency}
                  </span>
                  {commissionType === "percentage" && (
                    <span className="text-xs text-muted-foreground">
                      ≈ {calculateCommissionAmount()} {currency}
                    </span>
                  )}
                </div>
              </div>

              {/* Commission Type Toggle */}
              <div className="flex border border-border rounded-md overflow-hidden">
                <button
                  onClick={() => setCommissionType("percentage")}
                  className={cn(
                    "px-3 py-2 text-sm font-medium transition-colors",
                    commissionType === "percentage"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  %
                </button>
                <button
                  onClick={() => setCommissionType("dollar")}
                  className={cn(
                    "px-3 py-2 text-sm font-medium transition-colors",
                    commissionType === "dollar"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  $
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Final Step Indicator & Book Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
          <div className="flex items-center gap-2 text-accent">
            <Check className="h-5 w-5" />
            <span className="font-medium">This is the last step!</span>
          </div>

          <Button
            onClick={handleBookNow}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-3 text-lg"
          >
            Book Now
          </Button>
        </div>

        {/* Confirmation Message */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            Click to complete your booking and receive confirmation.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
