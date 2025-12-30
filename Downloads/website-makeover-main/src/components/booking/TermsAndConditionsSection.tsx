import { useState, useEffect } from "react";
import { FileText, Shield, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsAndConditionsSectionProps {
  hotelName?: string;
  cancellationPolicy?: string;
  requireAgeConfirmation?: boolean;
  onValidChange?: (isValid: boolean) => void;
  onTermsChange?: (terms: TermsState) => void;
}

export interface TermsState {
  termsAccepted: boolean;
  cancellationAccepted: boolean;
  privacyAccepted: boolean;
  ageConfirmed: boolean;
  marketingOptIn: boolean;
}

export function TermsAndConditionsSection({
  hotelName = "the hotel",
  cancellationPolicy,
  requireAgeConfirmation = false,
  onValidChange,
  onTermsChange,
}: TermsAndConditionsSectionProps) {
  const [terms, setTerms] = useState<TermsState>({
    termsAccepted: false,
    cancellationAccepted: false,
    privacyAccepted: false,
    ageConfirmed: false,
    marketingOptIn: false,
  });

  useEffect(() => {
    const isValid =
      terms.termsAccepted &&
      terms.cancellationAccepted &&
      terms.privacyAccepted &&
      (!requireAgeConfirmation || terms.ageConfirmed);
    
    onValidChange?.(isValid);
    onTermsChange?.(terms);
  }, [terms, requireAgeConfirmation, onValidChange, onTermsChange]);

  const handleChange = (key: keyof TermsState, value: boolean) => {
    setTerms((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              Terms & Conditions
            </h3>
            <p className="text-sm text-muted-foreground">
              Please review and accept before proceeding
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Terms and Conditions */}
          <div className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors">
            <Checkbox
              id="terms"
              checked={terms.termsAccepted}
              onCheckedChange={(checked) => handleChange("termsAccepted", checked as boolean)}
            />
            <div className="flex-1">
              <Label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                I agree to the{" "}
                <Dialog>
                  <DialogTrigger className="text-primary hover:underline">
                    Terms and Conditions
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Terms and Conditions</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <p>These Terms and Conditions govern your booking and use of our services.</p>
                        <h4 className="font-semibold text-foreground">1. Booking Confirmation</h4>
                        <p>Your booking is confirmed upon receipt of a confirmation email. Please review all details carefully.</p>
                        <h4 className="font-semibold text-foreground">2. Payment</h4>
                        <p>Payment is required as per the selected rate terms. We accept major credit cards and other specified payment methods.</p>
                        <h4 className="font-semibold text-foreground">3. Cancellation</h4>
                        <p>Cancellation policies vary by rate type. Please refer to the specific cancellation policy for your booking.</p>
                        <h4 className="font-semibold text-foreground">4. Guest Responsibilities</h4>
                        <p>Guests are expected to comply with hotel rules and regulations during their stay.</p>
                        <h4 className="font-semibold text-foreground">5. Liability</h4>
                        <p>We are not liable for any loss or damage to personal belongings during your stay.</p>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
                <span className="text-destructive ml-1">*</span>
              </Label>
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors">
            <Checkbox
              id="cancellation"
              checked={terms.cancellationAccepted}
              onCheckedChange={(checked) => handleChange("cancellationAccepted", checked as boolean)}
            />
            <div className="flex-1">
              <Label htmlFor="cancellation" className="text-sm font-medium cursor-pointer">
                I understand and accept the{" "}
                <Dialog>
                  <DialogTrigger className="text-primary hover:underline">
                    cancellation policy
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Cancellation Policy</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[300px] pr-4">
                      <div className="space-y-4 text-sm text-muted-foreground">
                        {cancellationPolicy ? (
                          <p>{cancellationPolicy}</p>
                        ) : (
                          <>
                            <p>The cancellation policy for {hotelName} varies based on the rate selected:</p>
                            <h4 className="font-semibold text-foreground">Flexible Rate</h4>
                            <p>Free cancellation up to 48 hours before check-in. After that, one night's stay will be charged.</p>
                            <h4 className="font-semibold text-foreground">Non-Refundable Rate</h4>
                            <p>No refund available for cancellations or no-shows.</p>
                            <h4 className="font-semibold text-foreground">Important Notes</h4>
                            <p>All cancellation times are in the hotel's local timezone. Early departures may be subject to charges.</p>
                          </>
                        )}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
                <span className="text-destructive ml-1">*</span>
              </Label>
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors">
            <Checkbox
              id="privacy"
              checked={terms.privacyAccepted}
              onCheckedChange={(checked) => handleChange("privacyAccepted", checked as boolean)}
            />
            <div className="flex-1">
              <Label htmlFor="privacy" className="text-sm font-medium cursor-pointer">
                I agree to the{" "}
                <Dialog>
                  <DialogTrigger className="text-primary hover:underline">
                    Privacy Policy
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Privacy Policy</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <p>We are committed to protecting your personal information.</p>
                        <h4 className="font-semibold text-foreground">Data Collection</h4>
                        <p>We collect personal information necessary to process your booking, including name, contact details, and payment information.</p>
                        <h4 className="font-semibold text-foreground">Data Usage</h4>
                        <p>Your information is used solely for booking purposes and to improve our services.</p>
                        <h4 className="font-semibold text-foreground">Data Protection</h4>
                        <p>We employ industry-standard security measures to protect your data.</p>
                        <h4 className="font-semibold text-foreground">Your Rights</h4>
                        <p>You have the right to access, correct, or delete your personal data at any time.</p>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
                <span className="text-destructive ml-1">*</span>
              </Label>
            </div>
          </div>

          {/* Age Confirmation (conditional) */}
          {requireAgeConfirmation && (
            <div className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors">
              <Checkbox
                id="age"
                checked={terms.ageConfirmed}
                onCheckedChange={(checked) => handleChange("ageConfirmed", checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="age" className="text-sm font-medium cursor-pointer">
                  I confirm I am 18 years of age or older
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  This hotel requires the primary guest to be at least 18 years old.
                </p>
              </div>
            </div>
          )}

          {/* Marketing Opt-in (optional) */}
          <div className="flex items-start gap-3 p-3 border border-muted rounded-lg hover:bg-muted/30 transition-colors">
            <Checkbox
              id="marketing"
              checked={terms.marketingOptIn}
              onCheckedChange={(checked) => handleChange("marketingOptIn", checked as boolean)}
            />
            <div className="flex-1">
              <Label htmlFor="marketing" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Send me exclusive deals and promotions
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Optional. You can unsubscribe at any time.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
