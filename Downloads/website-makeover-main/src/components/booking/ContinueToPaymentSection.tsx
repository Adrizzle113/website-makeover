import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Shield, Lock } from "lucide-react";

interface ContinueToPaymentSectionProps {
  totalPrice: number;
  currency: string;
  isLoading: boolean;
  onContinue: () => void;
}

export function ContinueToPaymentSection({
  totalPrice,
  currency,
  isLoading,
  onContinue,
}: ContinueToPaymentSectionProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6 lg:p-8">
        <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
          Continue to Payment
        </h2>

        {/* Price Display */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total to pay</span>
            <span className="text-2xl font-bold text-primary">
              {currency} {totalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start gap-3 mb-6">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
            className="mt-0.5"
          />
          <label
            htmlFor="terms"
            className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
          >
            I confirm the guest details are correct and agree to the{" "}
            <a href="#" className="text-primary hover:underline">
              cancellation policy
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary hover:underline">
              booking terms
            </a>
            .
          </label>
        </div>

        {/* Continue Button */}
        <Button
          onClick={onContinue}
          disabled={!termsAccepted || isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-lg"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Checking availability...
            </>
          ) : (
            "Continue to Payment"
          )}
        </Button>

        {/* Security Note */}
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>Payment will be completed securely on the next step</span>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-xs">Secure Booking</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-5 w-5 text-green-600" />
              <span className="text-xs">SSL Encrypted</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
